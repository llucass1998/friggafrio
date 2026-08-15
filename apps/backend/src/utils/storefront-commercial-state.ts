export type StorefrontCommercialState = "SELLABLE" | "OUT_OF_STOCK" | "PRICE_PENDING" | "QUOTE_ONLY"

export type StorefrontCommercialPolicy = {
  is_quote_only?: boolean
  requires_contact?: boolean
}

export type StorefrontCommercialProjection = {
  state: StorefrontCommercialState
  metadata: Record<string, unknown>
}

export const projectStorefrontCommercialState = ({
  metadata,
  policy,
  validPrice,
  availableQuantity,
}: {
  metadata?: Record<string, unknown> | null
  policy?: StorefrontCommercialPolicy | null
  validPrice: boolean
  availableQuantity: number
}): StorefrontCommercialProjection => {
  const nextMetadata: Record<string, unknown> = { ...(metadata ?? {}) }
  const explicitQuote = policy?.is_quote_only === true || nextMetadata.is_quote_only === true

  if (explicitQuote) {
    nextMetadata.is_quote_only = true
    nextMetadata.commercial_status = "QUOTE_ONLY"
    nextMetadata.product_sales_policy = "QUOTE_ONLY"
    nextMetadata.purchase_enabled = false
    nextMetadata.price_pending = false
    return { state: "QUOTE_ONLY", metadata: nextMetadata }
  }

  nextMetadata.is_quote_only = false
  nextMetadata.product_sales_policy = "DIRECT"
  nextMetadata.purchase_enabled = true

  if (!validPrice) {
    nextMetadata.commercial_status = "PRICE_PENDING"
    nextMetadata.price_pending = true
    return { state: "PRICE_PENDING", metadata: nextMetadata }
  }

  nextMetadata.price_pending = false
  if (availableQuantity > 0) {
    nextMetadata.commercial_status = "SELLABLE"
    return { state: "SELLABLE", metadata: nextMetadata }
  }

  nextMetadata.commercial_status = "OUT_OF_STOCK"
  return { state: "OUT_OF_STOCK", metadata: nextMetadata }
}
