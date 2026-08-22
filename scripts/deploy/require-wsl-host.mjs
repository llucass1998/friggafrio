import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const command = process.argv[2];
const scripts = {
  preflight: "deploy/wsl-preflight.sh",
  deploy: "deploy/wsl-deploy.sh",
  verify: "deploy/wsl-verify.sh",
  rollback: "deploy/wsl-rollback.sh",
};

function isWslHost() {
  if (process.platform !== "linux") return false;
  try {
    return /microsoft|wsl/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}

if (!scripts[command]) {
  console.error("DEPLOYMENT_COMMAND_INVALID");
  process.exitCode = 1;
} else if (!isWslHost()) {
  console.error("DEPLOYMENT_PLATFORM_DENIED: Production deployment is WSL-only.");
  process.exitCode = 1;
} else {
  const result = spawnSync("bash", [scripts[command], ...process.argv.slice(3)], {
    cwd: root,
    stdio: "inherit",
  });
  process.exitCode = result.status ?? 1;
}
