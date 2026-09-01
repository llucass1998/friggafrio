import fs from "node:fs/promises"
import { createRequire } from "node:module"
import path from "node:path"
import process from "node:process"

const workspace = path.resolve(process.argv[2] || process.cwd())
const canonicalEnv = process.env.FRIGGAFRIO_BACKEND_ENV ||
  "C:\\Users\\lluca\\orca\\secrets\\friggafrio\\backend.env"
const require = createRequire(path.join(workspace, "apps", "backend", "package.json"))
const { Client } = require("pg")

function parseEnv(source) {
  const values = new Map()
  for (const line of source.split(/\r?\n/u)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const separator = trimmed.indexOf("=")
    if (separator <= 0) continue
    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    values.set(key, value)
  }
  return values
}

const env = parseEnv(await fs.readFile(canonicalEnv, "utf8"))
const databaseUrl = env.get("DATABASE_URL")
if (!databaseUrl) throw new Error("DATABASE_URL is absent from canonical backend env")

const client = new Client({ connectionString: databaseUrl })
await client.connect()
try {
  const result = await client.query(`
    select ak.token
    from public.api_key ak
    join public.publishable_api_key_sales_channel link
      on link.publishable_key_id = ak.id
     and link.deleted_at is null
    where ak.type = 'publishable'
      and ak.revoked_at is null
      and ak.deleted_at is null
    order by ak.created_at desc
    limit 1
  `)
  const publishableKey = result.rows[0]?.token
  if (!publishableKey) throw new Error("No active publishable key is associated with a sales channel")

  const backendUrl = "http://localhost:9000"
  const projected = new Map([
    ["VITE_MEDUSA_BACKEND_URL", backendUrl],
    ["VITE_MEDUSA_PUBLISHABLE_KEY", publishableKey],
    ["VITE_PORT", "5173"],
    ["VITE_HMR_PORT", "5173"],
    ["VITE_PAYMENTS_ENABLED", env.get("PAYMENTS_ENABLED") || "false"],
    ["VITE_PAYMENT_PROVIDER_ENABLED", env.get("PAYMENT_PROVIDER_ENABLED") || "false"],
  ])

  const externalStorefrontEnv = process.env.FRIGGAFRIO_STOREFRONT_ENV
  if (externalStorefrontEnv) {
    try {
      const externalValues = parseEnv(await fs.readFile(externalStorefrontEnv, "utf8"))
      for (const [key, value] of externalValues) {
        if (key.startsWith("VITE_")) projected.set(key, value)
      }
    } catch (error) {
      throw new Error(`Unable to read FRIGGAFRIO_STOREFRONT_ENV: ${error.message}`)
    }
  }

  const renderStorefrontEnv = (existing) => {
    const merged = new Map(existing)
    for (const [key, value] of projected) merged.set(key, value)
    return [...merged.entries()]
      .filter(([, value]) => value !== "")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}=${value}`)
      .concat("")
      .join("\n")
  }

  const destinations = [path.join(workspace, "apps", "storefront", ".env")]
  const localOverride = path.join(workspace, "apps", "storefront", ".env.local")
  try {
    await fs.access(localOverride)
    destinations.push(localOverride)
  } catch {
    // No local override needs to be projected.
  }

  const results = []
  for (const destination of destinations) {
    await fs.mkdir(path.dirname(destination), { recursive: true })
    let state = "SYNCED"
    let existing = new Map()
    let currentContent = null
    try {
      currentContent = await fs.readFile(destination, "utf8")
      existing = parseEnv(currentContent)
    } catch {
      // Missing projection is created below.
    }
    const nextContent = renderStorefrontEnv(existing)
    if (currentContent === nextContent) state = "UNCHANGED"
    else await fs.writeFile(destination, nextContent, { encoding: "utf8" })
    results.push(`${destination}|${state}|PUBLISHABLE_KEY=PRESENT`)
  }
  console.log(results.join("\n"))
} finally {
  await client.end()
}
