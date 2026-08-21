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

test("deploy script contains the WSL, lock, dirty and SHA guards", () => {
  const script = readFileSync(join(root, "deploy/wsl-deploy.sh"), "utf8");
  assert.match(script, /DEPLOYMENT_PLATFORM_DENIED/);
  assert.match(script, /DEPLOY_ALREADY_RUNNING/);
  assert.match(script, /git status --porcelain/);
  assert.match(script, /SOURCE_SHA/);
  assert.match(script, /SOURCE_REMOTE_SHA_MISMATCH/);
  assert.match(script, /flock -n 9/);
  assert.match(script, /systemctl restart friggafrio-backend\.service/);
});
