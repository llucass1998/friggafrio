import type { OmieStockRecord } from "../integrations/omie/types"

export type OmieStockProduct = {
  productId: string
  externalId: string | null
  sku: string | null
  inventoryItemId: string | null
}

export type OmieStockLevel = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity?: number | null
  reserved_quantity?: number | null
}

export type OmieStockProjection = {
  operation: "create" | "update" | "no-op"
  productId: string
  inventoryItemId: string
  locationId: string
  stockedQuantity: number
  levelId?: string
  sourceExternalId: string | null
  sourceSku: string | null
}

export type OmieStockReconciliationPlan = {
  projections: OmieStockProjection[]
  skipped: Array<{ productId: string; reason: string }>
}

const indexSource = (records: readonly OmieStockRecord[], key: "externalId" | "sku") => {
  const index = new Map<string, OmieStockRecord[]>()
  for (const record of records) {
    const value = record[key]
    if (!value) continue
    index.set(value, [...(index.get(value) ?? []), record])
  }
  return index
}

export const buildOmieStockReconciliationPlan = (
  sources: readonly OmieStockRecord[],
  products: readonly OmieStockProduct[],
  levels: readonly OmieStockLevel[],
  locationId: string,
): OmieStockReconciliationPlan => {
  const byExternalId = indexSource(sources, "externalId")
  const bySku = indexSource(sources, "sku")
  const allLevelsByItem = new Map<string, OmieStockLevel[]>()
  for (const level of levels) {
    allLevelsByItem.set(level.inventory_item_id, [...(allLevelsByItem.get(level.inventory_item_id) ?? []), level])
  }
  const levelsByItem = new Map(levels.filter((level) => level.location_id === locationId).map((level) => [level.inventory_item_id, level]))
  const projections: OmieStockProjection[] = []
  const skipped: OmieStockReconciliationPlan["skipped"] = []

  for (const product of products) {
    const externalMatches = product.externalId ? byExternalId.get(product.externalId) ?? [] : []
    const skuMatches = product.sku ? bySku.get(product.sku) ?? [] : []
    if (externalMatches.length > 1 || skuMatches.length > 1) {
      skipped.push({ productId: product.productId, reason: "SOURCE_IDENTITY_AMBIGUOUS" })
      continue
    }
    const externalSource = externalMatches[0]
    const skuSource = skuMatches[0]
    if (externalSource && skuSource && externalSource !== skuSource) {
      skipped.push({ productId: product.productId, reason: "SOURCE_IDENTITY_CONFLICT" })
      continue
    }
    const source = externalSource ?? skuSource
    if (!source) {
      skipped.push({ productId: product.productId, reason: "SOURCE_NOT_FOUND" })
      continue
    }
    const existing = product.inventoryItemId ? levelsByItem.get(product.inventoryItemId) : undefined
    if (source.state === "MISSING") {
      skipped.push({
        productId: product.productId,
        reason: existing && (existing.stocked_quantity ?? 0) > 0
          ? "STALE_LEVEL_SOURCE_STOCK_MISSING"
          : "SOURCE_STOCK_MISSING",
      })
      continue
    }
    if (source.state === "INVALID" || source.physical === null) {
      skipped.push({
        productId: product.productId,
        reason: existing && (existing.stocked_quantity ?? 0) > 0
          ? "STALE_LEVEL_SOURCE_STOCK_INVALID"
          : "SOURCE_STOCK_INVALID",
      })
      continue
    }
    if (!product.inventoryItemId) {
      skipped.push({ productId: product.productId, reason: "INVENTORY_MAPPING_MISSING" })
      continue
    }
    if ((allLevelsByItem.get(product.inventoryItemId) ?? []).some((level) => level.location_id !== locationId)) {
      skipped.push({ productId: product.productId, reason: "INVENTORY_ITEM_ALREADY_MAPPED_TO_OTHER_LOCATION" })
      continue
    }
    projections.push({
      operation: existing
        ? existing.stocked_quantity === source.physical ? "no-op" : "update"
        : "create",
      productId: product.productId,
      inventoryItemId: product.inventoryItemId,
      locationId,
      stockedQuantity: source.physical,
      levelId: existing?.id,
      sourceExternalId: source.externalId,
      sourceSku: source.sku,
    })
  }

  return { projections, skipped }
}
