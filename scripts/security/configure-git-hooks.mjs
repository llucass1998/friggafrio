import { execFileSync } from "node:child_process"
import { resolve } from "node:path"

try {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim()
  const hooksPath = resolve(repoRoot, ".githooks")

  execFileSync("git", ["config", "core.hooksPath", hooksPath], {
    stdio: "inherit",
  })
  console.log(`Git hooks configured: ${hooksPath}`)
} catch {
  console.warn("Git hooks were not configured because Git is unavailable.")
}
