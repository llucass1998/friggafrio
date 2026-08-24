import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findProductionConfigViolations,
  parsePolicy,
  trackedEnvironmentViolations,
  validateWorktree,
} from "./project-policy-check.mjs";
import {
  detectDuplicateRuntime,
  parseSsListeners,
} from "./runtime-policy-check.mjs";
import { shaMatch } from "./release-policy-check.mjs";
import { evaluateSyncState } from "./source-sync-policy-check.mjs";

const root = join(fileURLToPath(new URL("..", import.meta.url)));

test("accepts the canonical policy JSON", () => {
  assert.equal(
    parsePolicy(
      readFileSync(join(root, "config/project-runtime-policy.json"), "utf8"),
    ).ports.backend,
    9000,
  );
  assert.throws(
    () => parsePolicy('{"project":"wrong"}'),
    /POLICY_IDENTITY_INVALID/,
  );
});

test("requires Git-only Windows to WSL source synchronization", () => {
  const policy = parsePolicy(
    readFileSync(join(root, "config/project-runtime-policy.json"), "utf8"),
  );
  assert.deepEqual(policy.sourceSynchronization, {
    mode: "git-only",
    canonicalPath: "Windows Maestro -> origin/Maestro -> WSL Maestro",
    manualCopyForbidden: true,
    wslDeployOnly: true,
    wslDeployEntrypoint: "deploy/wsl-deploy.sh",
    deployCloneImmutable: true,
    requireCleanDeployClone: true,
    requirePublicVerification: true,
    stabilityWindowSeconds: 300,
  });
  assert.throws(
    () => parsePolicy(JSON.stringify({ ...policy, sourceSynchronization: { mode: "copy" } })),
    /POLICY_SOURCE_SYNC_INVALID/,
  );
});

test("blocks wrong branch and Nautilus worktrees", () => {
  assert.equal(
    validateWorktree({
      branch: "feature",
      currentPath: "C:/repo/Maestro",
      canonicalPath: "C:/repo/Maestro",
    }).ok,
    false,
  );
  assert.equal(
    validateWorktree({
      branch: "Maestro",
      currentPath: "C:/repo/nautilus",
      canonicalPath: "C:/repo/Maestro",
    }).ok,
    false,
  );
});

test("blocks tracked environment files", () => {
  assert.deepEqual(
    trackedEnvironmentViolations([
      "apps/backend/.env",
      "apps/backend/.env.example",
    ]),
    ["apps/backend/.env"],
  );
});

test("blocks forbidden production admin origins and wildcard CORS", () => {
  const findings = findProductionConfigViolations([
    {
      file: "apps/storefront/.env.production",
      content: "VITE_MEDUSA_ADMIN_URL=http://localhost:9002\n",
    },
    { file: "apps/backend/.env.production", content: "STORE_CORS=*" },
  ]);
  assert.equal(findings.length, 2);
});

test("detects duplicate runtime ownership", () => {
  const listeners = parseSsListeners(
    'LISTEN 0 128 0.0.0.0:9000 0.0.0.0:* users:(("node",pid=222,fd=1))',
  );
  assert.equal(
    detectDuplicateRuntime({ listeners, servicePids: { backend: [111] } })
      .length,
    1,
  );
  assert.equal(
    detectDuplicateRuntime({ listeners, servicePids: { backend: [222] } })
      .length,
    0,
  );
});

test("requires equal release SHAs", () => {
  assert.equal(shaMatch("a", "a", "a"), true);
  assert.equal(shaMatch("a", "b", "a"), false);
});

test("source sync is fail-closed for dirty or divergent WSL state", () => {
  const base = {
    platform: "wsl",
    currentPath: "/home/srv/friggafrio/Maestro",
    expectedPath: "/home/srv/friggafrio/Maestro",
    branch: "Maestro",
    sourceSha: "same",
    remoteSha: "same",
    sourceDirty: false,
    trackedEnvironmentFiles: [],
    wslHead: "same",
    wslClean: "YES",
    deployClean: "YES",
    requireWsl: true,
  };
  assert.equal(evaluateSyncState(base).ready, true);
  assert.match(
    evaluateSyncState({ ...base, wslHead: "different" }).reasons.join(","),
    /WSL_REMOTE_SHA_MISMATCH/,
  );
  assert.match(
    evaluateSyncState({ ...base, deployClean: "NO" }).reasons.join(","),
    /WSL_DEPLOY_CLONE_DIRTY/,
  );
});

test("deploy script contains the WSL, lock, dirty and SHA guards", () => {
  const script = readFileSync(join(root, "deploy/wsl-deploy.sh"), "utf8");
  const guard = readFileSync(join(root, "deploy/wsl-guard-lib.sh"), "utf8");
  const preflight = readFileSync(join(root, "deploy/wsl-preflight.sh"), "utf8");
  const hostGuard = readFileSync(join(root, "scripts/deploy/require-wsl-host.mjs"), "utf8");
  const runtimeContract = readFileSync(join(root, "scripts/deploy/medusa-runtime-contract.mjs"), "utf8");
  const backendService = readFileSync(join(root, "deploy/systemd/friggafrio-backend.service"), "utf8");
  const deploymentPolicy = `${script}\n${guard}\n${preflight}`;
  assert.match(guard, /DEPLOYMENT_PLATFORM_DENIED/);
  assert.match(hostGuard, /DEPLOYMENT_PLATFORM_DENIED/);
  assert.match(guard, /DEPLOY_ALREADY_RUNNING/);
  assert.match(deploymentPolicy, /git.*status --porcelain/);
  assert.match(deploymentPolicy, /SOURCE_SHA/);
  assert.match(deploymentPolicy, /SOURCE_REMOTE_SHA_MISMATCH/);
  assert.match(deploymentPolicy, /source-sync-policy-check\.mjs" --deploy/);
  assert.match(guard, /flock -n 9/);
  assert.match(script, /systemctl restart friggafrio-backend\.service/);
  assert.match(script, /install_medusa_runtime_dependencies/);
  assert.match(guard, /--filter backend --prod deploy/);
  assert.match(guard, /MEDUSA_RUNTIME_DEPENDENCIES_STALE/);
  assert.match(preflight, /require_backend_service_runtime_contract/);
  assert.match(runtimeContract, /MEDUSA_ADMIN_INDEX_MISSING/);
  assert.match(backendService, /WorkingDirectory=.*\.medusa\/server/);
  assert.match(backendService, /EnvironmentFile=.*apps\/backend\/\.env/);
  assert.doesNotMatch(backendService, /DISABLE_MEDUSA_ADMIN=true/);
  assert.match(guard, /DEPLOY_BLOCKED_WSL_UNSTABLE/);
  assert.doesNotMatch(deploymentPolicy, /down\s+-v|\bdocker\s+prune\b|\bvolume\s+rm\b/);
});
