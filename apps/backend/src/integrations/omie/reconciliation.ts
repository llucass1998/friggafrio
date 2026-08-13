import { createHash } from "node:crypto"
import type { NormalizedProduct } from "./types"

export interface MedusaOmieProjection {
  id: string
  externalId: string | null
  sku: string | null
  fingerprint: string | null
  status?: string | null
  storefrontVisible?: boolean | null
  purchaseEnabled?: boolean | null
  commercialStatus?: string | null
}

export type ReconciliationAction = "create" | "update" | "no-op" | "conflict" | "skip"

export interface ReconciliationItem {
  action: ReconciliationAction
  product: NormalizedProduct
  reason: string
}

const canonical = (product: NormalizedProduct) => ({
  externalId: product.externalId,
  title: product.title,
  variants: product.variants.map((variant) => ({
    externalId: variant.externalId,
    title: variant.title,
    sku: variant.sku,
    price: variant.price,
    inventory: variant.inventory,
  })),
})

export const omieFingerprint = (product: NormalizedProduct): string =>
  createHash("sha256").update(JSON.stringify(canonical(product))).digest("hex")

export const isInactiveOmieRecord = (record: Record<string, unknown>): boolean => {
  const value = record.inativo
  const normalized = value === null || value === undefined ? "" : String(value).trim().toUpperCase()
  return ["S", "SIM", "Y", "YES", "TRUE", "1"].includes(normalized)
}

export const buildOmieReconciliation = (
  products: readonly NormalizedProduct[],
  existing: readonly MedusaOmieProjection[],
  inactiveIndexes: ReadonlySet<number> = new Set(),
): ReconciliationItem[] => {
  const byExternal = new Map<string, MedusaOmieProjection[]>()
  const bySku = new Map<string, MedusaOmieProjection[]>()
  for (const row of existing) {
    if (row.externalId) byExternal.set(row.externalId, [...(byExternal.get(row.externalId) ?? []), row])
    if (row.sku) bySku.set(row.sku, [...(bySku.get(row.sku) ?? []), row])
  }

  const incomingExternal = new Set<string>()
  const incomingSku = new Set<string>()
  return products.map((product, index) => {
    const externalId = product.externalId
    const sku = product.variants[0]?.sku ?? null
    if (inactiveIndexes.has(index)) return { action: "skip", product, reason: "inactive upstream product" }
    if (!externalId || !sku) return { action: "conflict", product, reason: "externalId and SKU are required" }
    if (incomingExternal.has(externalId) || incomingSku.has(sku)) {
      return { action: "conflict", product, reason: "duplicate upstream stable identifier" }
    }
    incomingExternal.add(externalId)
    incomingSku.add(sku)
    const matches = new Map<string, MedusaOmieProjection>()
    for (const row of [...(byExternal.get(externalId) ?? []), ...(bySku.get(sku) ?? [])]) matches.set(row.id, row)
    if (matches.size > 1) return { action: "conflict", product, reason: "ambiguous Medusa stable identifier" }
    if (matches.size === 0) return { action: "create", product, reason: "new stable mapping" }
    const current = [...matches.values()][0]
    if (current.fingerprint !== omieFingerprint(product)) {
      return { action: "conflict", product, reason: "managed source drift requires explicit review" }
    }
    if (
      current.status !== undefined &&
      (current.status !== "published" ||
        current.storefrontVisible !== true ||
        current.purchaseEnabled !== false ||
        current.commercialStatus !== "QUOTE_ONLY")
    ) {
      return { action: "update", product, reason: "QUOTE_ONLY storefront projection requires reconciliation" }
    }
    return { action: "no-op", product, reason: "managed Omie projection unchanged" }
  })
}

export const stableOmieHandle = (externalId: string): string => {
  const readable = externalId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)
  const suffix = createHash("sha256").update(externalId).digest("hex").slice(0, 12)
  return `omie-${readable || "product"}-${suffix}`
}
