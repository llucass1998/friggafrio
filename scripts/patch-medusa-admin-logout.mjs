import { cp, readFile, writeFile } from "node:fs/promises"
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"

const projectRoot = fileURLToPath(new URL("..", import.meta.url))
const adminBuild = resolve(projectRoot, "apps/backend/.medusa/server/public/admin")
const runtimeAdmin = resolve(projectRoot, "apps/backend/public/admin")
const envFile = resolve(projectRoot, "apps/backend/.env")

const readStorefrontUrl = async () => {
  if (process.env.STOREFRONT_URL?.trim()) {
    return process.env.STOREFRONT_URL.trim()
  }

  if (!existsSync(envFile)) {
    return null
  }

  const env = await readFile(envFile, "utf8")
  const match = env.match(/^STOREFRONT_URL=(.*)$/m)
  return match?.[1]?.trim() || null
}

const storefrontUrl = await readStorefrontUrl()
if (!storefrontUrl) {
  console.warn("Skipping Admin logout patch because STOREFRONT_URL is not configured.")
  process.exit(0)
}

const homeUrl = `${storefrontUrl.replace(/\/$/, "")}/br`
const replacement = `fetch("/admin/auth/logout",{method:"DELETE",credentials:"include"}).then(function(response){if(!response.ok&&response.status!==401&&response.status!==403){throw new Error("Admin logout failed")}window.location.assign(${JSON.stringify(homeUrl)})})`
const files = []

if (existsSync(adminBuild)) {
  const walk = async (directory) => {
    const entries = await (await import("node:fs/promises")).readdir(directory, { withFileTypes: true })
    for (const entry of entries) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) {
        await walk(path)
      } else if (/\.(?:js|mjs)$/.test(entry.name)) {
        files.push(path)
      }
    }
  }
  await walk(adminBuild)
}

let patched = 0
for (const file of files) {
  const source = await readFile(file, "utf8")
  const marker = 'queryClient.clear();\n            navigate("/login");'
  const count = source.split(marker).length - 1
  let next = source
  if (count) {
    next = next.replaceAll(marker, `queryClient.clear();\n            ${replacement};`)
    patched += count
  }

  // The production bundle is minified, so the same handlers become
  // `cache.clear(),navigate("/login")` with short variable names.
  const minified = /([A-Za-z_$][\w$]*)\.clear\(\),([A-Za-z_$][\w$]*)\("\/login"\)/g
  next = next.replace(minified, (_match, cache, navigate) => {
    patched += 1
    return `${cache}.clear(),${replacement}`
  })

  if (next !== source) {
    await writeFile(file, next)
  }
}

if (patched < 2) {
  throw new Error(`Expected at least two Admin logout handlers, patched ${patched}.`)
}

await cp(adminBuild, runtimeAdmin, { recursive: true, force: true })
console.log(`Patched ${patched} Medusa Admin logout handlers.`)
