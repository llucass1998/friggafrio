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

const storefrontUrl = (await readStorefrontUrl()) || "https://friggafrio.istigestao.com.br"
const homeUrl = `${storefrontUrl.replace(/\/$/, "")}/br`
const replacement = `(function(){var h=window.location.hostname;var target=(h==="localhost"||h==="127.0.0.1"||h==="::1")?("http://"+h+":5173/br"):(${JSON.stringify(homeUrl)});try{sessionStorage.removeItem("frigga.admin.logout.pending");document.cookie="frigga_admin_logged_out=;Path=/;Max-Age=0";}catch(e){}window.location.assign(target);})()`

const directoriesToPatch = [adminBuild, runtimeAdmin].filter((dir) => existsSync(dir))

const walk = async (directory, fileList) => {
  const entries = await (await import("node:fs/promises")).readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      await walk(path, fileList)
    } else if (/\.(?:js|mjs)$/.test(entry.name)) {
      fileList.push(path)
    }
  }
}

let totalPatched = 0
for (const dir of directoriesToPatch) {
  const files = []
  await walk(dir, files)

  for (const file of files) {
    const source = await readFile(file, "utf8")
    const marker = 'queryClient.clear();\n            navigate("/login");'
    const count = source.split(marker).length - 1
    let next = source
    if (count) {
      next = next.replaceAll(marker, `queryClient.clear();\n            ${replacement};`)
      totalPatched += count
    }

    // The production bundle is minified, so the same handlers become
    // `cache.clear(),navigate("/login")` with short variable names.
    const minified = /([A-Za-z_$][\w$]*)\.clear\(\),([A-Za-z_$][\w$]*)\(["']\/login["']\)/g
    next = next.replace(minified, (_match, cache, _navigate) => {
      totalPatched += 1
      return `${cache}.clear(),${replacement}`
    })

    if (next !== source) {
      await writeFile(file, next)
    }
  }
}

if (existsSync(adminBuild) && existsSync(runtimeAdmin)) {
  await cp(adminBuild, runtimeAdmin, { recursive: true, force: true })
}

console.log(`Patched ${totalPatched} Medusa Admin logout handlers across directories.`)

