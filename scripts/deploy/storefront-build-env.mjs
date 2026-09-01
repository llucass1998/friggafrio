import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

function parseEnvFile(path) {
  if (!existsSync(path)) return new Map()
  const values = new Map()
  for (const line of readFileSync(path, "utf8").split(/\r?\n/u)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const separator = trimmed.indexOf("=")
    if (separator <= 0) continue
    values.set(trimmed.slice(0, separator).trim(), trimmed.slice(separator + 1).trim())
  }
  return values
}

export function readStorefrontBuildEnv(directory) {
  const values = parseEnvFile(resolve(directory, "apps/storefront/.env"))
  for (const [key, value] of parseEnvFile(resolve(directory, "apps/storefront/.env.local"))) {
    values.set(key, value)
  }
  return values
}

export function validateStorefrontBuildEnv(directory, { requireMaps = false } = {}) {
  const values = readStorefrontBuildEnv(directory)
  const mapsKey = values.get("VITE_GOOGLE_MAPS_EMBED_API_KEY") || ""
  const mapsRequired = requireMaps || values.get("VITE_GOOGLE_MAPS_REQUIRED") === "true"

  if (mapsRequired && !mapsKey) {
    throw new Error("VITE_GOOGLE_MAPS_EMBED_API_KEY is required before the storefront build")
  }

  return {
    mapsRequired: mapsRequired ? "YES" : "NO",
    mapsKey: mapsKey ? "PRESENT" : "ABSENT",
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  const directory = process.argv[2] || process.cwd()
  const result = validateStorefrontBuildEnv(directory, {
    requireMaps: process.argv.includes("--require-maps"),
  })
  console.log(`STOREFRONT_MAPS_REQUIRED=${result.mapsRequired}`)
  console.log(`STOREFRONT_MAPS_KEY=${result.mapsKey}`)
  console.log("STOREFRONT_BUILD_ENV=PASS")
}
