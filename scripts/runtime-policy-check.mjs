import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const policy = JSON.parse(
  readFileSync(join(repoRoot, "config", "project-runtime-policy.json"), "utf8"),
);

const command = (name, args, options = {}) => {
  try {
    return execFileSync(name, args, {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      ...options,
    }).trim();
  } catch {
    return "";
  }
};

export function detectDuplicateRuntime({ listeners, servicePids }) {
  const duplicatePorts = [];
  for (const listener of listeners) {
    const expected =
      listener.port === policy.ports.backend
        ? (servicePids.backend ?? [])
        : listener.port === policy.ports.storefront
          ? (servicePids.storefront ?? [])
          : [];
    const unexpected = listener.pids.filter((pid) => !expected.includes(pid));
    if (unexpected.length > 0)
      duplicatePorts.push({ port: listener.port, pids: unexpected });
  }
  return duplicatePorts;
}

export function parseSsListeners(output) {
  const listeners = [];
  for (const line of output.split(/\r?\n/)) {
    const portMatch = line.match(/(?:^|\s)LISTEN\s+\d+\s+\d+\s+[^ ]*:(\d+)\s/);
    if (!portMatch) continue;
    const pids = [...line.matchAll(/pid=(\d+)/g)].map((match) =>
      Number(match[1]),
    );
    listeners.push({ port: Number(portMatch[1]), pids });
  }
  return listeners;
}

function isWsl() {
  if (process.platform !== "linux") return false;
  if (process.env.WSL_INTEROP) return true;
  try {
    return /microsoft|wsl/i.test(readFileSync("/proc/version", "utf8"));
  } catch {
    return false;
  }
}

function serviceState(service) {
  return command("systemctl", ["is-active", service]) || "unavailable";
}

function servicePid(service) {
  const value = command("systemctl", [
    "show",
    service,
    "--property=MainPID",
    "--value",
  ]);
  return Number(value) || 0;
}

export function main() {
  const platform =
    process.platform === "win32"
      ? "windows"
      : isWsl()
        ? "wsl"
        : process.platform;
  const branch = command("git", ["branch", "--show-current"]);
  const sha = command("git", ["rev-parse", "HEAD"]);
  console.log("FRIGGAFRIO_RUNTIME_POLICY");
  console.log(`PLATFORM: ${platform}`);
  console.log(`WORKTREE: ${command("git", ["rev-parse", "--show-toplevel"])}`);
  console.log(`BRANCH: ${branch}`);
  console.log(`SOURCE_SHA: ${sha}`);
  console.log(`WSL_SOURCE_PATH: ${policy.wslSource}`);
  console.log(`DEPLOY_PATH: ${policy.wslDeploy}`);
  console.log(`DEPLOYMENT_ALLOWED: ${platform === "wsl" ? "YES" : "NO"}`);

  if (platform !== "wsl") {
    console.log("SYSTEMD_STATE: NOT_REQUIRED_ON_WINDOWS");
    console.log("BACKEND_PORT_OWNER: NOT_PROBED_ON_WINDOWS");
    console.log("STOREFRONT_PORT_OWNER: NOT_PROBED_ON_WINDOWS");
    console.log("DUPLICATE_RUNTIMES: NOT_PROBED_ON_WINDOWS");
    return;
  }

  const backendState = serviceState(policy.services.backend);
  const storefrontState = serviceState(policy.services.storefront);
  const servicePids = {
    backend: [servicePid(policy.services.backend)],
    storefront: [servicePid(policy.services.storefront)],
  };
  const listeners = parseSsListeners(command("ss", ["-ltnp"])).filter(
    ({ port }) =>
      [policy.ports.backend, policy.ports.storefront].includes(port),
  );
  const duplicates = detectDuplicateRuntime({ listeners, servicePids });
  console.log(
    `SYSTEMD_STATE: backend=${backendState}, storefront=${storefrontState}`,
  );
  console.log(
    `BACKEND_PORT_OWNER: ${listeners.find(({ port }) => port === policy.ports.backend)?.pids.join(",") || "none"}`,
  );
  console.log(
    `STOREFRONT_PORT_OWNER: ${listeners.find(({ port }) => port === policy.ports.storefront)?.pids.join(",") || "none"}`,
  );
  console.log(`DUPLICATE_RUNTIMES: ${duplicates.length ? "FAIL" : "PASS"}`);
  if (duplicates.length) process.exitCode = 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
)
  main();
