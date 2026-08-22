import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const policyFile = join(repoRoot, "config", "project-runtime-policy.json");

const runGit = (args) =>
  execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  }).trim();

const normalizePath = (value) =>
  value.trim().replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();

export function validateWorktree({
  branch,
  currentPath,
  canonicalPath,
  isCi = false,
}) {
  const forbiddenPath = /(?:^|\/)nautilus(?:\/|$)/i.test(
    currentPath.replace(/\\/g, "/"),
  );
  if (forbiddenPath)
    return { ok: false, reason: "NAUTILUS_WORKTREE_FORBIDDEN" };
  if (isCi) return { ok: true, reason: "CI_PATH_BRANCH_BYPASS" };
  if (branch !== "Maestro") return { ok: false, reason: "WRONG_BRANCH" };
  if (normalizePath(currentPath) !== normalizePath(canonicalPath)) {
    return { ok: false, reason: "WRONG_WORKTREE" };
  }
  return { ok: true, reason: "CANONICAL_WORKTREE" };
}

export function trackedEnvironmentViolations(files) {
  return files.filter(
    (file) =>
      /(^|[\\/])\.env(?:\.[^/\\]+)?$/i.test(file) &&
      !/\.env\.(?:example|template)$/i.test(file),
  );
}

const secretPatterns = [
  /-----BEGIN (?:RSA |OPENSSH |EC |)PRIVATE KEY-----/i,
  /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{24,}\b/i,
  /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
];

export function scanSecretPatterns(sources) {
  return sources
    .filter(({ content }) =>
      secretPatterns.some((pattern) => pattern.test(content)),
    )
    .map(({ file }) => file);
}

export function parsePolicy(raw) {
  const policy = JSON.parse(raw);
  if (
    policy.project !== "friggafrio" ||
    policy.canonicalBranch !== "Maestro" ||
    policy.remoteBranch !== "origin/Maestro"
  ) {
    throw new Error("POLICY_IDENTITY_INVALID");
  }
  if (
    policy.deploymentPlatform !== "wsl" ||
    policy.productionRuntime !== "systemd"
  ) {
    throw new Error("POLICY_PLATFORM_INVALID");
  }
  if (policy.ports?.backend !== 9000 || policy.ports?.storefront !== 5173) {
    throw new Error("POLICY_PORTS_INVALID");
  }
  if (
    !Array.isArray(policy.forbiddenCanonicalPorts) ||
    ![5174, 9001, 9002].every((port) =>
      policy.forbiddenCanonicalPorts.includes(port),
    )
  ) {
    throw new Error("POLICY_FORBIDDEN_PORTS_INVALID");
  }
  const sourceSynchronization = policy.sourceSynchronization;
  if (
    sourceSynchronization?.mode !== "git-only" ||
    sourceSynchronization?.canonicalPath !==
      "Windows Maestro -> origin/Maestro -> WSL Maestro" ||
    sourceSynchronization?.manualCopyForbidden !== true ||
    sourceSynchronization?.wslDeployOnly !== true ||
    sourceSynchronization?.wslDeployEntrypoint !== "deploy/wsl-deploy.sh" ||
    sourceSynchronization?.deployCloneImmutable !== true ||
    sourceSynchronization?.requireCleanDeployClone !== true ||
    sourceSynchronization?.requirePublicVerification !== true ||
    sourceSynchronization?.stabilityWindowSeconds !== 300
  ) {
    throw new Error("POLICY_SOURCE_SYNC_INVALID");
  }
  return policy;
}

export function findProductionConfigViolations(sources) {
  const findings = [];
  const forbiddenUrl =
    /(?:VITE_MEDUSA_(?:BACKEND|ADMIN)_URL|(?:PUBLIC|ADMIN|BACKEND|STOREFRONT)_ORIGIN)\s*[:=][^\r\n]*(?::(?:5174|9001|9002)\b|localhost|127\.0\.0\.1)/i;
  const wildcardCors =
    /(?:STORE_CORS|AUTH_CORS|ADMIN_CORS|storeCors|authCors|adminCors)\s*[:=][\s"']*\*/i;
  for (const source of sources) {
    const productionContext =
      /(?:^|[\\/])(?:deploy[\\/]|[^/\\]+\.env\.production$|[^/\\]+production[^/\\]*)/i.test(
        source.file,
      );
    if (!productionContext) continue;
    if (forbiddenUrl.test(source.content))
      findings.push({ file: source.file, reason: "FORBIDDEN_CANONICAL_URL" });
    if (wildcardCors.test(source.content))
      findings.push({ file: source.file, reason: "WILDCARD_CORS" });
  }
  return findings;
}

function trackedSources() {
  const files = runGit(["ls-files", "-z"]).split("\0").filter(Boolean);
  return files
    .map((file) => {
      try {
        return { file, content: readFileSync(join(repoRoot, file), "utf8") };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function untrackedSources() {
  const files = runGit(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean);
  return files
    .map((file) => {
      try {
        return { file, content: readFileSync(join(repoRoot, file), "utf8") };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function productionSources(sources) {
  return sources
    .filter(({ file }) => {
      const normalized = file.replace(/\\/g, "/");
      return (
        normalized.startsWith("apps/backend/") ||
        normalized.startsWith("apps/storefront/src/") ||
        normalized.startsWith("deploy/") ||
        normalized.startsWith(".github/")
      );
    })
    .filter(({ file }) => !/(^|\/)docs?\//i.test(file));
}

export function main() {
  const failures = [];
  let policy;
  try {
    policy = parsePolicy(readFileSync(policyFile, "utf8"));
    console.log("POLICY_JSON: PASS");
  } catch (error) {
    failures.push(error.message);
    console.error(`POLICY_JSON: FAIL (${error.message})`);
  }

  const currentPath = runGit(["rev-parse", "--show-toplevel"]);
  const branch = runGit(["branch", "--show-current"]);
  let canonicalPath = currentPath;
  try {
    const blocks = runGit(["worktree", "list", "--porcelain"]).split(/\n\n+/);
    const canonical = blocks.find((block) =>
      block.includes("branch refs/heads/Maestro"),
    );
    canonicalPath =
      canonical
        ?.split(/\r?\n/)
        .find((line) => line.startsWith("worktree "))
        ?.slice(9) ?? currentPath;
  } catch {
    failures.push("WORKTREE_DISCOVERY_FAILED");
  }
  const worktree = validateWorktree({
    branch,
    currentPath,
    canonicalPath,
    isCi: process.env.GITHUB_ACTIONS === "true",
  });
  console.log(
    `WORKTREE: ${worktree.ok ? "PASS" : "FAIL"} (${worktree.reason})`,
  );
  if (!worktree.ok) failures.push(worktree.reason);

  const files = runGit(["ls-files", "-z"]).split("\0").filter(Boolean);
  const envViolations = trackedEnvironmentViolations(files);
  console.log(`ENV_TRACKED: ${envViolations.length ? "FAIL" : "PASS"}`);
  if (envViolations.length) failures.push("ENV_TRACKED");

  const sources = [...trackedSources(), ...untrackedSources()];
  const secretFindings = scanSecretPatterns(sources);
  console.log(`SECRET_PATTERNS: ${secretFindings.length ? "FAIL" : "PASS"}`);
  if (secretFindings.length) failures.push("SECRET_PATTERNS");

  const configFindings = policy
    ? findProductionConfigViolations(productionSources(sources))
    : [];
  console.log(`PRODUCTION_CONFIG: ${configFindings.length ? "FAIL" : "PASS"}`);
  if (configFindings.length) failures.push("PRODUCTION_CONFIG");

  if (failures.length) {
    console.error(
      `FRIGGAFRIO_POLICY_BLOCKED: ${[...new Set(failures)].join(", ")}`,
    );
    process.exitCode = 1;
    return;
  }
  console.log("FRIGGAFRIO_PROJECT_POLICY: PASS");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))
)
  main();
