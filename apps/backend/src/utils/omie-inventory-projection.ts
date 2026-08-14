export type OmieInventoryProjectionSource = {
  productId: string
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    id?: string | null
    inventory_items?: Array<{ inventory_item_id?: string | null }> | null
  }> | null
}

export type InventoryLevelSnapshot = {
  id: string
  inventory_item_id: string
  location_id: string
}

export type InventoryLevelProjection = {
  operation: "create" | "update"
  productId: string
  inventoryItemId: string
  locationId: string
  stockedQuantity: number
  levelId?: string
}

export type OmieInventoryProjectionPlan = {
  projections: InventoryLevelProjection[]
  skipped: Array<{ productId: string; reason: string }>
}

const observedStock = (metadata: Record<string, unknown> | null | undefined): number | null => {
  const value = metadata?.inventory_quantity_observed
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return null
  }
  return value
}

/**
 * Projects only the stock value captured by the Gate 5 Omie import. The
 * single-variant/single-inventory-item requirement avoids guessing a split.
 */
export const buildOmieInventoryProjectionPlan = (
  products: OmieInventoryProjectionSource[],
  locationId: string,
  levels: InventoryLevelSnapshot[],
): OmieInventoryProjectionPlan => {
  const levelsByItem = new Map(levels.map((level) => [level.inventory_item_id, level]))
  const projections: InventoryLevelProjection[] = []
  const skipped: OmieInventoryProjectionPlan["skipped"] = []

  for (const product of products) {
    const stockedQuantity = observedStock(product.metadata)
    if (stockedQuantity === null) {
      skipped.push({ productId: product.productId, reason: "MISSING_OR_INVALID_OMIE_STOCK" })
      continue
    }

    const variants = product.variants ?? []
    if (variants.length !== 1) {
      skipped.push({ productId: product.productId, reason: "AMBIGUOUS_VARIANT_MAPPING" })
      continue
    }
    const inventoryItems = variants[0]?.inventory_items ?? []
    if (inventoryItems.length !== 1 || !inventoryItems[0]?.inventory_item_id) {
      skipped.push({ productId: product.productId, reason: "AMBIGUOUS_INVENTORY_MAPPING" })
      continue
    }

    const inventoryItemId = inventoryItems[0].inventory_item_id
    const existing = levelsByItem.get(inventoryItemId)
    if (existing && existing.location_id !== locationId) {
      skipped.push({ productId: product.productId, reason: "INVENTORY_ITEM_ALREADY_MAPPED_TO_OTHER_LOCATION" })
      continue
    }
    projections.push({
      operation: existing ? "update" : "create",
      productId: product.productId,
      inventoryItemId,
      locationId,
      stockedQuantity,
      levelId: existing?.id,
    })
  }

  return { projections, skipped }
}
