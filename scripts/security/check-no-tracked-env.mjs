import { execFileSync } from "node:child_process"

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
}).split("\0").filter(Boolean)

const isEnvironmentFile = (file) => /(^|\\|\/)\.env(?:\.|$)/.test(file)
const isEnvironmentTemplate = (file) => /(^|\\|\/)\.env\.(?:example|template)$/.test(file)
const forbiddenFiles = trackedFiles.filter(
  (file) => isEnvironmentFile(file) && !isEnvironmentTemplate(file)
)

if (forbiddenFiles.length) {
  console.error("Environment file policy failed. Keep only .env.example or .env.template in Git.")
  for (const file of forbiddenFiles) console.error(file)
  process.exitCode = 1
} else {
  console.log("Environment file policy: PASS")
}
