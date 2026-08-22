import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePolicy, trackedEnvironmentViolations } from "./project-policy-check.mjs";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const policy = parsePolicy(
  readFileSync(resolve(repoRoot, "config/project-runtime-policy.json"), "utf8"),
);
const deployCheck = process.argv.includes("--deploy");

const git = (args, cwd = repoRoot) =>
  execFileSync("git", args, { cwd, encoding: "utf8" }).trim();

export const normalizePath = (value) =>
  value.trim().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();

export function evaluateSyncState({
  platform,
  currentPath,
  expectedPath,
  branch,
  sourceSha,
  remoteSha,
  sourceDirty,
  trackedEnvironmentFiles,
  wslHead = "NOT_CHECKED",
  wslClean = "NOT_CHECKED",
  deployClean = "NOT_CHECKED",
  requireWsl = false,
}) {
  const reasons = [];
  const states = {
    // After a reviewed push, origin/Maestro is the Windows release reference in WSL.
    WINDOWS_HEAD: platform === "windows" ? sourceSha : remoteSha || "UNKNOWN",
    REMOTE_HEAD: remoteSha || "missing",
    WSL_HEAD: wslHead,
    HEAD_MATCH: sourceSha && remoteSha && sourceSha === remoteSha ? "YES" : "NO",
    WINDOWS_CLEAN: platform === "windows" ? (sourceDirty ? "NO" : "YES") : "NOT_APPLICABLE",
    WSL_CLEAN: wslClean,
    DEPLOY_CLONE_CLEAN: deployClean,
    ENV_TRACKED: trackedEnvironmentFiles.length ? "FAIL" : "PASS",
  };

  if (normalizePath(currentPath) !== normalizePath(expectedPath)) {
    reasons.push("CANONICAL_SOURCE_PATH_REQUIRED");
  }
  if (branch !== policy.canonicalBranch) reasons.push("CANONICAL_BRANCH_REQUIRED");
  if (!remoteSha || sourceSha !== remoteSha) reasons.push("SOURCE_REMOTE_SHA_MISMATCH");
  if (sourceDirty) reasons.push(platform === "windows" ? "WINDOWS_SOURCE_DIRTY" : "WSL_SOURCE_DIRTY");
  if (trackedEnvironmentFiles.length) reasons.push("ENV_TRACKED");
  if (requireWsl && (wslHead === "NOT_CHECKED" || wslClean === "NOT_CHECKED")) {
    reasons.push("WSL_STATE_NOT_CHECKED");
  }
  if (requireWsl && wslHead !== "NOT_CHECKED" && wslHead !== remoteSha) {
    reasons.push("WSL_REMOTE_SHA_MISMATCH");
  }
  if (requireWsl && wslClean !== "YES") reasons.push("WSL_SOURCE_DIRTY");
  if (requireWsl && deployClean !== "YES") reasons.push("WSL_DEPLOY_CLONE_DIRTY");

  return { states, reasons, ready: reasons.length === 0 };
}

function isWsl() {
  if (process.platform !== "linux") return false;
  try {
    return /microsoft|wsl/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}

function getGitSnapshot(directory) {
  try {
    return {
      head: git(["rev-parse", "HEAD"], directory),
      clean: git(["status", "--porcelain", "--untracked-files=all"], directory) ? "NO" : "YES",
    };
  } catch {
    return { head: "MISSING", clean: "NO" };
  }
}

function main() {
  const platform = process.platform === "win32" ? "windows" : isWsl() ? "wsl" : process.platform;
  const currentPath = git(["rev-parse", "--show-toplevel"]);
  const sourceSha = git(["rev-parse", "HEAD"]);
  const branch = git(["branch", "--show-current"]);
  const sourceDirty = Boolean(git(["status", "--porcelain", "--untracked-files=all"]));
  let remoteSha = "";
  try {
    remoteSha = git(["rev-parse", policy.remoteBranch]);
  } catch {
    // The result below remains fail-closed when the tracking ref is absent.
  }

  const trackedEnvironmentFiles = trackedEnvironmentViolations(
    git(["ls-files", "-z"]).split("\0").filter(Boolean),
  );
  const wslSnapshot = platform === "wsl" ? getGitSnapshot(policy.wslSource) : null;
  const deploySnapshot = platform === "wsl" ? getGitSnapshot(policy.wslDeploy) : null;
  const result = evaluateSyncState({
    platform,
    currentPath,
    expectedPath: platform === "windows" ? policy.windowsSource : policy.wslSource,
    branch,
    sourceSha,
    remoteSha,
    sourceDirty,
    trackedEnvironmentFiles,
    wslHead: wslSnapshot?.head,
    wslClean: wslSnapshot?.clean,
    deployClean: deploySnapshot?.clean,
    requireWsl: deployCheck,
  });

  console.log("FRIGGAFRIO_CANONICAL_SOURCE_SYNC");
  console.log(`PLATFORM: ${platform}`);
  console.log(`FLOW: ${policy.sourceSynchronization.canonicalPath}`);
  console.log(`CURRENT_PATH: ${currentPath}`);
  for (const [name, value] of Object.entries(result.states)) console.log(`${name}: ${value}`);
  console.log(`SYNC_READY: ${result.ready ? "YES" : "NO"}`);
  console.log(`DEPLOYMENT_ALLOWED: ${deployCheck && platform === "wsl" && result.ready ? "YES" : "NO"}`);
  if (!result.ready) {
    console.error(`FRIGGAFRIO_SOURCE_SYNC_BLOCKED: ${[...new Set(result.reasons)].join(", ")}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main();
