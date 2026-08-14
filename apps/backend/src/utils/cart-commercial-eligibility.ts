export type CommercialState =
  | "SELLABLE"
  | "QUOTE_ONLY"
  | "PRICE_PENDING"
  | "OUT_OF_STOCK"
  | "INVALID"

export type CommercialLine = {
  id?: string
  quantity?: number | null
  unit_price?: number | null
  metadata?: Record<string, unknown> | null
  variant?: {
    inventory_quantity?: number | null
    manage_inventory?: boolean | null
    allow_backorder?: boolean | null
    metadata?: Record<string, unknown> | null
    product?: { metadata?: Record<string, unknown> | null } | null
  } | null
}

export type InventorySnapshot = {
  inventory_quantity?: number | null
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
}

export function validateInventoryQuantity(
  requestedQuantity: unknown,
  snapshot: InventorySnapshot
): { eligible: boolean; reason?: string } {
  if (typeof requestedQuantity !== "number" || !Number.isSafeInteger(requestedQuantity) || requestedQuantity < 1) {
    return { eligible: false, reason: "INVALID_QUANTITY" }
  }
  if (snapshot.manage_inventory === false || snapshot.allow_backorder === true) {
    return { eligible: true }
  }
  if (typeof snapshot.inventory_quantity !== "number" || !Number.isSafeInteger(snapshot.inventory_quantity)) {
    return { eligible: false, reason: "MISSING_INVENTORY" }
  }
  if (snapshot.inventory_quantity < requestedQuantity) {
    return { eligible: false, reason: "INSUFFICIENT_INVENTORY" }
  }
  return { eligible: true }
}

export type CommercialLineResult = {
  lineId?: string
  state: CommercialState
  reason: string
}

export type CartCommercialResult = {
  eligible: boolean
  checkoutReady: boolean
  blockingLines: CommercialLineResult[]
}

const metadataValue = (
  line: CommercialLine,
  key: string
): unknown => line.metadata?.[key] ?? line.variant?.metadata?.[key] ?? line.variant?.product?.metadata?.[key]

/** Resolve the commercial state from persisted server-side line data. */
export function resolveCommercialState(line: CommercialLine): CommercialLineResult {
  const quantity = line.quantity
  if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1) {
    return { lineId: line.id, state: "INVALID", reason: "INVALID_QUANTITY" }
  }

  const commercialStatus = metadataValue(line, "commercial_status")
  const salesPolicy = metadataValue(line, "product_sales_policy")
  const quoteOnly = metadataValue(line, "is_quote_only") === true
    || commercialStatus === "QUOTE_ONLY"
    || salesPolicy === "QUOTE_ONLY"
  if (quoteOnly) {
    return { lineId: line.id, state: "QUOTE_ONLY", reason: "QUOTE_ONLY" }
  }

  const pricePending = metadataValue(line, "price_pending") === true
    || typeof line.unit_price !== "number"
    || !Number.isFinite(line.unit_price)
    || line.unit_price <= 0
  if (pricePending) {
    return { lineId: line.id, state: "PRICE_PENDING", reason: "PRICE_PENDING" }
  }

  const inventory = validateInventoryQuantity(quantity, line.variant ?? {})
  if (!inventory.eligible) {
    return {
      lineId: line.id,
      state: "OUT_OF_STOCK",
      reason: inventory.reason ?? "INSUFFICIENT_INVENTORY",
    }
  }

  return { lineId: line.id, state: "SELLABLE", reason: "SELLABLE" }
}

export type CartCommercialEligibilityOptions = {
  /**
   * Inventory is reserved by the Medusa boundary after this commercial pass.
   * Use only there: the reservation workflow remains the authoritative,
   * locking-backed inventory decision.
   */
  deferInventoryValidation?: boolean
}

export function validateCartCommercialEligibility(
  lines: CommercialLine[],
  options: CartCommercialEligibilityOptions = {},
): CartCommercialResult {
  if (lines.length === 0) {
    return {
      eligible: false,
      checkoutReady: false,
      blockingLines: [{ state: "INVALID", reason: "EMPTY_CART" }],
    }
  }
  const blockingLines = lines
    .map((line) => {
      if (!options.deferInventoryValidation) return resolveCommercialState(line)

      // Preserve quantity and commercial checks, but do not rely on the
      // storefront inventory_quantity projection. The checkout-ready route
      // loads real location levels and performs the definitive reservation.
      const inventoryBypassed = {
        ...line,
        variant: line.variant
          ? { ...line.variant, inventory_quantity: Number.MAX_SAFE_INTEGER }
          : line.variant,
      }
      return resolveCommercialState(inventoryBypassed)
    })
    .filter((result) => result.state !== "SELLABLE")
  return {
    eligible: blockingLines.length === 0,
    checkoutReady: blockingLines.length === 0,
    blockingLines,
  }
}
