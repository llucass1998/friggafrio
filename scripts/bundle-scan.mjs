import { readdir, readFile } from "node:fs/promises"
import { extname, join, relative, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const DEFAULT_ROOTS = [
  "apps/backend/.medusa/server",
  "apps/storefront/dist",
]

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".mjs",
  ".txt",
])

const PRIVATE_PATTERNS = [
  { id: "private-key", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
  { id: "jwt", pattern: /(?:^|[\s"'`=:(])eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}(?=$|[\s"'`,;)])/g },
  { id: "aws-access-key", pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { id: "resend-api-key", pattern: /\bre_[A-Za-z0-9]{20,}\b/g },
  // Mercado Pago publishable keys are intentionally present in the browser.
  // Only flag an APP_USR value when it is assigned to a private-token field.
  {
    id: "mercado-pago-private-token",
    pattern: /\b(?:MERCADO_PAGO_ACCESS_TOKEN|mercadoPagoAccessToken|access_token)\s*[:=]\s*["']APP_USR-[A-Za-z0-9-]{24,}["']/gi,
  },
  { id: "webhook-secret", pattern: /\bwhsec_[A-Za-z0-9_-]{20,}\b/g },
  { id: "bearer-access-token", pattern: /\bBearer\s+[A-Za-z0-9._~+/=-]{24,}\b/g },
  {
    id: "private-environment-secret",
    pattern: /\b(?:RESEND_API_KEY|EMAIL_FROM|GOOGLE_CLIENT_SECRET|OMIE_APP_(?:KEY|SECRET)|MERCADO_PAGO_WEBHOOK_SECRET|FRIGGAFRIO_ROUTE_PROVIDER_API_KEY)\s*[:=]\s*["']([^"'\\\s]{8,})["']/gi,
  },
  {
    id: "password-literal",
    pattern: /\b(?:password|passwd|senha)\s*[:=]\s*["'](?!password|senha|\{\{|<)[^"'\\\s]{10,}["']/gi,
  },
  {
    id: "pan-literal",
    pattern: /\b(?:pan|card_number|cardNumber|numero_cartao)\s*[:=]\s*["']\d{13,19}["']/gi,
  },
  {
    id: "cvv-literal",
    pattern: /\b(?:cvv|cvc|security_code)\s*[:=]\s*["']\d{3,4}["']/gi,
  },
  {
    id: "session-cookie-value",
    pattern: /\b(?:connect\.sid|frigga\.sid)=[A-Za-z0-9%._~-]{16,}/g,
  },
]

const isScannable = (filePath) => TEXT_EXTENSIONS.has(extname(filePath).toLowerCase())

const isDevelopmentOnlyArtifact = (filePath) =>
  /(?:^|[\\/])(?:__tests__|tests?)(?:[\\/]|$)|(?:^|[\\/])[^\\/]+\.(?:unit\.)?spec\.[cm]?js$/i.test(filePath)

const isLikelyHumanLabel = (value) =>
  !/[0-9\W_]/u.test(value) && value.length <= 32

const isLikelyPasswordSecret = (match) => {
  const value = match.match(/["']([^"']+)["']\s*$/)?.[1] ?? ""
  if (!value || isLikelyHumanLabel(value)) return false
  return !/^(?:supersecret|secret|password|senha|new-password)$/i.test(value)
}

const shouldKeepHit = (hit, contents) => {
  if (hit.id === "password-literal" && !isLikelyPasswordSecret(contents.slice(hit.index))) return false
  return true
}

const walk = async (root) => {
  const entries = await readdir(root, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) files.push(...await walk(path))
    else if (entry.isFile() && isScannable(path)) files.push(path)
  }
  return files
}

export const scanText = (text, filePath = "<memory>") => {
  const hits = []
  for (const { id, pattern } of PRIVATE_PATTERNS) {
    pattern.lastIndex = 0
    let match
    while ((match = pattern.exec(text)) !== null) {
      if (id !== "password-literal" || isLikelyPasswordSecret(match[0])) {
        hits.push({ id, file: filePath, index: match.index })
      }
      if (!pattern.global) break
    }
  }
  return hits
}

export const scanBundles = async (roots = DEFAULT_ROOTS, baseDir = process.cwd()) => {
  const hits = []
  let fileCount = 0
  for (const configuredRoot of roots) {
    const root = resolve(baseDir, configuredRoot)
    let files
    try {
      files = await walk(root)
    } catch (error) {
      if (error?.code === "ENOENT") continue
      throw error
    }
    for (const file of files) {
      fileCount += 1
      const contents = await readFile(file, "utf8")
      const relativeFile = relative(baseDir, file)
      if (isDevelopmentOnlyArtifact(relativeFile)) continue
      hits.push(...scanText(contents, relativeFile).filter((hit) => shouldKeepHit(hit, contents)))
    }
  }
  return { fileCount, hits }
}

const main = async () => {
  const result = await scanBundles()
  if (result.hits.length) {
    console.error(`BUNDLE_SCAN=FAIL_PRIVATE_CREDENTIAL_HITS_${result.hits.length}`)
    for (const hit of result.hits) console.error(`${hit.id}:${hit.file}`)
    process.exitCode = 1
    return
  }
  console.log(`BUNDLE_SCAN=PASS_0_PRIVATE_CREDENTIAL_HITS files=${result.fileCount}`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  await main()
}
