import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

const repoRoot = process.cwd()
const isEnvironmentFile = (file) => /(^|\\|\/)\.env(?:\.|$)/.test(file)
const isEnvironmentTemplate = (file) => /(^|\\|\/)\.env\.(?:example|template)$/.test(file)
const runGit = (args, options = {}) =>
  execFileSync("git", args, {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    ...options,
  })

const readEnvValue = (name) => {
  const fromProcess = process.env[name]?.trim()
  if (fromProcess) return fromProcess

  const envPath = join(repoRoot, "apps", "backend", ".env")
  if (!existsSync(envPath)) return ""

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`))
  return line?.slice(name.length + 1).trim().replace(/^(['"])(.*)\1$/, "$2") ?? ""
}

const trackedFiles = runGit(["ls-files", "-z"]).split("\0").filter(Boolean)
const untrackedFiles = runGit(["ls-files", "--others", "--exclude-standard", "-z"])
  .split("\0")
  .filter(Boolean)
const readWorkspaceContent = (files) => files
  .filter((file) =>
    !isEnvironmentFile(file) || isEnvironmentTemplate(file)
  )
  .map((file) => {
    try {
      return { file, content: readFileSync(join(repoRoot, file), "utf8") }
    } catch {
      return null
    }
  })
  .filter(Boolean)
const trackedContent = readWorkspaceContent(trackedFiles)
const untrackedContent = readWorkspaceContent(untrackedFiles)

const currentDiff = runGit(["diff", "--binary"])
const stagedDiff = runGit(["diff", "--cached", "--binary"])
const history = runGit(["log", "--all", "--format=%H", "--no-renames"])
  .split(/\r?\n/)
  .filter(Boolean)
  .map((commit) => runGit(["show", "--format=", "--no-ext-diff", commit]))
  .join("\n")

const historicalExpiredJwt = (() => {
  try {
    const token = runGit(["show", "e576de2:apps/storefront/token.txt"]).trim()
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8"))
    return payload.exp * 1000 < Date.now() ? token : ""
  } catch {
    return ""
  }
})()
const historyForBlockingScan = historicalExpiredJwt
  ? history.replaceAll(historicalExpiredJwt, "[HISTORICAL_EXPIRED_SECRET]")
  : history

const exactValues = [
  ["OMIE_APP_KEY", readEnvValue("OMIE_APP_KEY")],
  ["OMIE_APP_SECRET", readEnvValue("OMIE_APP_SECRET")],
].filter(([, value]) => value.length > 0)

const credentialPatterns = [
  { name: "JWT-like token", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { name: "private key", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |)PRIVATE KEY-----/g },
  { name: "live Stripe key", pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g },
  { name: "GitHub token", pattern: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: "bearer token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g },
]

const exactMatches = (value, sources) =>
  sources.some(({ content }) => content.includes(value))

const scanPattern = (sources, pattern) => {
  const matches = []
  for (const source of sources) {
    pattern.lastIndex = 0
    if (pattern.test(source.content)) matches.push(source.file)
  }
  return [...new Set(matches)]
}

const trackedSources = [
  ...trackedContent,
  { file: "unstaged diff", content: currentDiff },
  { file: "staged diff", content: stagedDiff },
]
const workspaceSources = [...trackedSources, ...untrackedContent]
const historySource = [{ file: "git history", content: historyForBlockingScan }]
const rawHistorySource = [{ file: "git history", content: history }]

const trackedFindings = credentialPatterns.flatMap(({ name, pattern }) =>
  scanPattern(trackedSources, pattern).map((file) => ({ name, file }))
)
const untrackedFindings = credentialPatterns.flatMap(({ name, pattern }) =>
  scanPattern(untrackedContent, pattern).map((file) => ({ name, file }))
)
const historyFindings = credentialPatterns.flatMap(({ name, pattern }) =>
  scanPattern(historySource, pattern).map((file) => ({ name, file }))
)
const exactCurrentInTracked = exactValues.filter(([, value]) =>
  exactMatches(value, workspaceSources)
)
const exactCurrentInHistory = exactValues.filter(([, value]) =>
  exactMatches(value, rawHistorySource)
)
const forbiddenTrackedEnv = trackedFiles.filter((file) =>
  isEnvironmentFile(file) && !isEnvironmentTemplate(file)
)
const privateKeyFiles = [...new Set([...trackedFiles, ...untrackedFiles])].filter((file) =>
  /(^|\\|\/)(?:id_(?:rsa|dsa|ecdsa|ed25519)|.*\.(?:pem|key|p12|pfx))$/i.test(file)
)

const report = {
  envIgnored: (() => {
    try {
      return runGit(["check-ignore", "--quiet", "apps/backend/.env"]) === ""
    } catch {
      return false
    }
  })(),
  envTracked: trackedFiles.includes("apps/backend/.env"),
  currentCredentials: {
    OMIE_APP_KEY: readEnvValue("OMIE_APP_KEY") ? "PRESENT" : "MISSING",
    OMIE_APP_SECRET: readEnvValue("OMIE_APP_SECRET") ? "PRESENT" : "MISSING",
  },
  trackedFindings,
  untrackedFindings,
  historyFindings,
  exactCurrentInTracked: exactCurrentInTracked.map(([name]) => name),
  exactCurrentInHistory: exactCurrentInHistory.map(([name]) => name),
  forbiddenTrackedEnv,
  privateKeyFiles,
}

console.log(`.env ignored: ${report.envIgnored ? "YES" : "NO"}`)
console.log(`.env tracked: ${report.envTracked ? "YES" : "NO"}`)
console.log(`OMIE_APP_KEY: ${report.currentCredentials.OMIE_APP_KEY}`)
console.log(`OMIE_APP_SECRET: ${report.currentCredentials.OMIE_APP_SECRET}`)
console.log(`Tracked secret-pattern findings: ${trackedFindings.length}`)
console.log(`Untracked secret-pattern findings: ${untrackedFindings.length}`)
console.log(`Git-history secret-pattern findings: ${historyFindings.length}`)
if (historicalExpiredJwt) console.warn("Warning: HISTORICAL_EXPIRED_SECRET retained in Git history (non-blocking).")
console.log(`Current Omie credentials in tracked/current content: ${exactCurrentInTracked.length ? "FOUND" : "NOT_FOUND"}`)
console.log(`Current Omie credentials in Git history: ${exactCurrentInHistory.length ? "FOUND" : "NOT_FOUND"}`)
console.log(`Private key files: ${privateKeyFiles.length}`)

if (report.envTracked || forbiddenTrackedEnv.length || privateKeyFiles.length || trackedFindings.length || untrackedFindings.length || historyFindings.length || exactCurrentInTracked.length || exactCurrentInHistory.length) {
  console.error("Secret scan failed: review findings without printing secret values.")
  process.exitCode = 1
} else {
  console.log("Reusable secret scan: PASS")
}
