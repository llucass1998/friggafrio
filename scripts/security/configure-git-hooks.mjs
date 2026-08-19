import { execFileSync } from "node:child_process"
import { resolve } from "node:path"

try {
  const repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
    encoding: "utf8",
  }).trim()
  execFileSync("git", ["config", "core.hooksPath", resolve(repoRoot, ".githooks")], {
    stdio: "inherit",
  })
} catch {
  console.warn("Git hooks were not configured because Git is unavailable.")
}
