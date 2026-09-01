import { execFileSync } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export class ScanInfrastructureError extends Error {
  constructor(scope) {
    super(`Secret scan infrastructure failed while reading ${scope}.`)
    this.scope = scope
  }
}

const isEnvironmentFile = (file) => /(^|\\|\/)\.env(?:\.|$)/.test(file)
const isEnvironmentTemplate = (file) => /(^|\\|\/)\.env\.(?:example|template)$/.test(file)
const splitNull = (value) => value.split("\0").filter(Boolean)

const credentialPatterns = [
  { category: "JWT-like token", pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g },
  { category: "private key", pattern: /-----BEGIN (?:RSA |OPENSSH |EC |)PRIVATE KEY-----/g },
  { category: "live Stripe key", pattern: /\b(?:sk|rk)_live_[A-Za-z0-9]{16,}\b/g },
  { category: "GitHub token", pattern: /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/g },
  { category: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { category: "bearer token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}\b/g },
]

const runGit = (repoRoot, args, options = {}) => {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      ...options,
    })
  } catch {
    throw new ScanInfrastructureError("git")
  }
}

const runGitBuffer = (repoRoot, args) => {
  try {
    return execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "buffer",
      maxBuffer: 64 * 1024 * 1024,
    }).toString("utf8")
  } catch {
    throw new ScanInfrastructureError("git-object")
  }
}

const isIgnored = (repoRoot, file) => {
  try {
    execFileSync("git", ["check-ignore", "--quiet", file], {
      cwd: repoRoot,
      stdio: "ignore",
    })
    return true
  } catch (error) {
    if (error.status === 1) return false
    throw new ScanInfrastructureError("git")
  }
}

const readWorkspaceFile = (repoRoot, file) => {
  try {
    return readFileSync(join(repoRoot, file)).toString("utf8")
  } catch {
    throw new ScanInfrastructureError("workspace-file")
  }
}

const readEnvValue = (repoRoot, name) => {
  const fromProcess = process.env[name]?.trim()
  if (fromProcess) return fromProcess

  const envPath = join(repoRoot, "apps", "backend", ".env")
  if (!existsSync(envPath)) return ""

  const line = readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .find((entry) => entry.startsWith(`${name}=`))
  return line?.slice(name.length + 1).trim().replace(/^(['"])(.*)\1$/, "$2") ?? ""
}

const isExpiredJwt = (value) => {
  try {
    const payload = JSON.parse(Buffer.from(value.split(".")[1], "base64url").toString("utf8"))
    return Number.isFinite(payload.exp) && payload.exp * 1000 < Date.now()
  } catch {
    return false
  }
}

const scanText = (content, source, exactValues) => {
  const findings = []
  for (const { category, pattern } of credentialPatterns) {
    const matcher = new RegExp(pattern.source, pattern.flags)
    const matches = [...content.matchAll(matcher)].map((match) => match[0])
    if (category === "JWT-like token" && source.scope === "reachable-history") {
      if (matches.some((match) => !isExpiredJwt(match))) findings.push({ ...source, category })
    } else if (matches.length > 0) {
      findings.push({ ...source, category })
    }
  }
  for (const [name, value] of exactValues) {
    if (value && content.includes(value)) {
      findings.push({ ...source, category: `configured ${name}` })
    }
  }
  return findings
}

const uniqueFindings = (findings) => {
  const seen = new Set()
  return findings.filter((finding) => {
    const key = `${finding.scope}\0${finding.path}\0${finding.location}\0${finding.category}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const scanWorkspaceFiles = (repoRoot, files, scope, reader, exactValues) =>
  files.flatMap((file) => {
    if (isEnvironmentFile(file) && !isEnvironmentTemplate(file)) return []
    return scanText(reader(file), { scope, path: file, location: "workspace" }, exactValues)
  })

const scanReachableHistory = (repoRoot, exactValues) => {
  const commits = runGit(repoRoot, ["rev-list", "--all"])
    .split(/\r?\n/)
    .filter(Boolean)
  const history = commits
    .map((commit) => runGit(repoRoot, ["show", "--format=", "--no-ext-diff", commit]))
    .join("\n")
  return scanText(
    history,
    { scope: "reachable-history", path: "git history", location: "reachable commits" },
    exactValues,
  )
}

export const scanRepository = (repoRoot) => {
  const trackedFiles = splitNull(runGit(repoRoot, ["ls-files", "-z"]))
  const untrackedFiles = splitNull(runGit(repoRoot, ["ls-files", "--others", "--exclude-standard", "-z"]))
  const stagedFiles = splitNull(runGit(repoRoot, ["diff", "--cached", "--name-only", "-z"]))
  const exactValues = [
    ["OMIE_APP_KEY", readEnvValue(repoRoot, "OMIE_APP_KEY")],
    ["OMIE_APP_SECRET", readEnvValue(repoRoot, "OMIE_APP_SECRET")],
  ].filter(([, value]) => value.length > 0)
  const forbiddenTrackedEnv = trackedFiles.filter((file) =>
    isEnvironmentFile(file) && !isEnvironmentTemplate(file)
  )
  const privateKeyFiles = [...new Set([...trackedFiles, ...untrackedFiles])].filter((file) =>
    /(^|\\|\/)(?:id_(?:rsa|dsa|ecdsa|ed25519)|.*\.(?:pem|key|p12|pfx))$/i.test(file)
  )
  const findings = [
    ...scanWorkspaceFiles(repoRoot, trackedFiles, "tracked", (file) => readWorkspaceFile(repoRoot, file), exactValues),
    ...scanWorkspaceFiles(repoRoot, stagedFiles, "staged", (file) => runGitBuffer(repoRoot, ["show", `:${file}`]), exactValues),
    ...scanWorkspaceFiles(repoRoot, untrackedFiles, "untracked", (file) => readWorkspaceFile(repoRoot, file), exactValues),
    ...scanReachableHistory(repoRoot, exactValues),
  ]
  return {
    envIgnored: isIgnored(repoRoot, "apps/backend/.env"),
    envTracked: trackedFiles.includes("apps/backend/.env"),
    forbiddenTrackedEnv,
    privateKeyFiles,
    findings: uniqueFindings(findings),
  }
}

export const printReport = (report) => {
  console.log(`.env ignored: ${report.envIgnored ? "YES" : "NO"}`)
  console.log(`.env tracked: ${report.envTracked ? "YES" : "NO"}`)
  console.log(`Tracked environment files: ${report.forbiddenTrackedEnv.length}`)
  console.log(`Private key files: ${report.privateKeyFiles.length}`)
  console.log(`Secret findings: ${report.findings.length}`)
  for (const finding of report.findings) {
    console.log(`SECRET_FINDING scope=${finding.scope} category=${finding.category} path=${finding.path} location=${finding.location}`)
  }
}

export const hasFindings = (report) =>
  report.envTracked || report.forbiddenTrackedEnv.length > 0 || report.privateKeyFiles.length > 0 || report.findings.length > 0
