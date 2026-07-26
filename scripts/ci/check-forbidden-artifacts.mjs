import { execFileSync } from "node:child_process"

const trackedFiles = execFileSync("git", ["ls-files", "-z"], {
  encoding: "utf8",
})
  .split("\0")
  .filter(Boolean)

const allowedEnvironmentFiles = new Set([
  "apps/backend/.env.example",
  "apps/backend/.env.template",
  "apps/backend/.env.test",
  "apps/storefront/.env.example",
  "apps/storefront/.env.production",
])

const forbiddenPatterns = [
  /(^|\/)node_modules\//,
  /(^|\/)(dist|dist-ssr|build|coverage|playwright-report|test-results)\//,
  /(^|\/)(screenshots|uploads-local)\//,
  /(^|\/)token\.txt$/i,
  /\.token$/i,
  /\.log(\.\d+)?$/i,
  /(^|\/)temp_[^/]*$/i,
  /\.(dump|backup)$/i,
  /(^|\/)(pg_dump|dump-)[^/]*\.sql$/i,
]

const forbidden = trackedFiles.filter((file) => {
  if (
    /(^|\/)\.env(\..+)?$/.test(file) &&
    !allowedEnvironmentFiles.has(file)
  ) {
    return true
  }

  return forbiddenPatterns.some((pattern) => pattern.test(file))
})

if (forbidden.length > 0) {
  console.error("Tracked generated or sensitive artifacts were found:")
  forbidden.forEach((file) => console.error(`- ${file}`))
  process.exit(1)
}

console.log(`Repository artifact guard passed for ${trackedFiles.length} files.`)
