import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function run(label, command, args) {
  try {
    execFileSync(command, args, { cwd: repoRoot, stdio: "inherit" });
    console.log(`${label}: PASS`);
    return true;
  } catch {
    console.error(`${label}: FAIL`);
    return false;
  }
}

export function shaMatch(source, remote, deploy) {
  return Boolean(
    source && remote && deploy && source === remote && remote === deploy,
  );
}

export function main() {
  const results = [
    run("WORKTREE_GUARD", process.execPath, ["scripts/worktree-guard.mjs"]),
    run("PROJECT_POLICY", "node", ["scripts/project-policy-check.mjs"]),
    run("DIFF_CHECK", "git", ["diff", "--check"]),
    run("ENV_TRACKING", "node", ["scripts/project-policy-check.mjs"]),
  ];
  if (!results.every(Boolean)) {
    console.error("FRIGGAFRIO_RELEASE_POLICY: BLOCKED");
    process.exitCode = 1;
    return;
  }
  console.log("FRIGGAFRIO_RELEASE_POLICY: PASS");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
)
  main();
