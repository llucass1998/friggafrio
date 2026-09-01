import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { platform, tmpdir } from "node:os"
import { fileURLToPath } from "node:url"

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")
export const defaultManifestPath = join(tmpdir(), "friggafrio-source-integrity.json")

const sourceRoots = [
  "apps/backend/src",
  "apps/storefront/src",
  "apps/storefront/tests",
  "apps/storefront/playwright.config.ts",
  "apps/backend/package.json",
  "apps/storefront/package.json",
  "package.json",
  "pnpm-lock.yaml",
  "scripts",
  "config",
]
const excluded = /(^|[\\/])(?:node_modules|dist|build|\.medusa|\.git)(?:[\\/]|$)|(^|[\\/])\.env(?:$|\.)/i
const forbiddenCommands = /(?:^|\s)(?:git\s+(?:reset|restore|checkout\s+--|clean|stash|revert)|copy(?:-item)?\s+.*(?:src|apps[\\/]backend|apps[\\/]storefront)|rsync\s+.*(?:src|apps[\\/]backend|apps[\\/]storefront)|rm\s+-.*(?:src|apps[\\/]backend|apps[\\/]storefront)|remove-item\s+.*(?:src|apps[\\/]backend|apps[\\/]storefront))/i

const normalize = (file) => file.replace(/\\/g, "/")
const hashFile = (file) => createHash("sha256").update(readFileSync(file)).digest("hex")

export const collectSourceFiles = (root = repoRoot) => {
  const files = []
  for (const sourceRoot of sourceRoots) {
    const absolute = resolve(root, sourceRoot)
    if (!existsSync(absolute)) continue
    const stat = lstatSync(absolute)
    if (stat.isFile()) {
      const relativePath = normalize(relative(root, absolute))
      if (!excluded.test(relativePath)) files.push(relativePath)
    } else walkFromRoot(root, absolute, files)
  }
  return [...new Set(files)].sort()
}

const walkFromRoot = (root, absolutePath, output) => {
  const stat = lstatSync(absolutePath)
  if (stat.isFile()) {
    const relativePath = normalize(relative(root, absolutePath))
    if (!excluded.test(relativePath)) output.push(relativePath)
    return
  }
  for (const entry of readdirSync(absolutePath)) walkFromRoot(root, join(absolutePath, entry), output)
}

export const createManifest = (root = repoRoot) => ({
  version: 1,
  files: collectSourceFiles(root).map((file) => {
    const absolute = join(root, file)
    const stat = lstatSync(absolute)
    return { path: file, size: stat.size, sha256: hashFile(absolute) }
  }),
})

export const compareManifests = (before, after) => {
  const oldFiles = new Map(before.files.map((file) => [file.path, file]))
  const newFiles = new Map(after.files.map((file) => [file.path, file]))
  const added = [...newFiles.keys()].filter((file) => !oldFiles.has(file)).sort()
  const removed = [...oldFiles.keys()].filter((file) => !newFiles.has(file)).sort()
  const changed = [...newFiles.keys()].filter((file) => oldFiles.has(file) && (oldFiles.get(file).sha256 !== newFiles.get(file).sha256 || oldFiles.get(file).size !== newFiles.get(file).size)).sort()
  return { added, removed, changed, mutated: added.length > 0 || removed.length > 0 || changed.length > 0 }
}

export const assertSafeCommand = (command, args = []) => {
  const rendered = [command, ...args].join(" ")
  if (forbiddenCommands.test(rendered)) {
    const error = new Error("DESTRUCTIVE_COMMAND_BLOCKED")
    error.code = "DESTRUCTIVE_COMMAND_BLOCKED"
    throw error
  }
}

const resolvePnpmCli = () => {
  const commandPath = execFileSync("where.exe", ["pnpm.cmd"], { encoding: "utf8" }).split(/\r?\n/).find(Boolean)
  if (!commandPath) throw new Error("SOURCE_GUARD_PNPM_NOT_FOUND")
  const cli = join(dirname(commandPath.trim()), "node_modules", "pnpm", "bin", "pnpm.cjs")
  if (!existsSync(cli)) throw new Error("SOURCE_GUARD_PNPM_CLI_MISSING")
  return cli
}

const readManifest = (manifestPath) => JSON.parse(readFileSync(manifestPath, "utf8"))
const writeManifest = (manifestPath, manifest) => writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8")

export const snapshot = (manifestPath = defaultManifestPath, root = repoRoot) => {
  const manifest = createManifest(root)
  writeManifest(manifestPath, manifest)
  return manifest
}

export const verify = (manifestPath = defaultManifestPath, root = repoRoot) => {
  if (!existsSync(manifestPath)) throw new Error("SOURCE_INTEGRITY_MANIFEST_MISSING")
  const result = compareManifests(readManifest(manifestPath), createManifest(root))
  if (result.mutated) {
    const evidencePath = `${manifestPath}.mutation.json`
    writeFileSync(evidencePath, `${JSON.stringify(result, null, 2)}\n`, "utf8")
    const error = new Error("SOURCE_MUTATION_DURING_TEST")
    error.code = "SOURCE_MUTATION_DURING_TEST"
    error.result = result
    error.evidencePath = evidencePath
    throw error
  }
  return result
}

export const runGuarded = (command, args = [], options = {}) => {
  assertSafeCommand(command, args)
  const manifestPath = options.manifestPath ?? defaultManifestPath
  snapshot(manifestPath, options.root ?? repoRoot)
  const runsPnpmOnWindows = platform() === "win32" && command === "pnpm"
  const executable = runsPnpmOnWindows ? process.execPath : command
  const commandArgs = runsPnpmOnWindows ? [resolvePnpmCli(), ...args] : args
  const result = spawnSync(executable, commandArgs, { cwd: options.root ?? repoRoot, stdio: "inherit", shell: false })
  if (result.error) {
    console.error(`SOURCE_GUARD_COMMAND_FAILED: ${result.error.code ?? "spawn_error"}`)
  }
  try {
    verify(manifestPath, options.root ?? repoRoot)
  } catch (error) {
    console.error(error.code ?? error.message)
    return 1
  }
  return result.status ?? 1
}

const [mode, ...rest] = process.argv.slice(2)
if (mode === "snapshot") {
  const manifest = snapshot(rest[0] ?? defaultManifestPath)
  console.log(`SOURCE_INTEGRITY_SNAPSHOT: PASS (${manifest.files.length} files)`)
} else if (mode === "verify") {
  const result = verify(rest[0] ?? defaultManifestPath)
  console.log(`SOURCE_INTEGRITY_VERIFY: PASS (${result.changed.length} changed)`)
} else if (mode === "run") {
  const separator = rest.indexOf("--")
  if (separator < 1) throw new Error("USAGE: source-integrity-guard.mjs run <command> -- <args>")
  process.exitCode = runGuarded(rest[0], rest.slice(separator + 1))
} else if (mode) {
  throw new Error(`Unknown source integrity mode: ${mode}`)
}
