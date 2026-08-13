import { HttpTypes } from "@medusajs/types"
import { isVariantInStock } from "@/lib/utils/product"

export type ProductPurchaseState =
  | { status: "purchasable"; variant: HttpTypes.StoreProductVariant; price: number }
  | { status: "select_variant"; variants: HttpTypes.StoreProductVariant[] }
  | { status: "quote_only"; reason: string }
  | { status: "price_pending"; reason: string }
  | { status: "out_of_stock"; reason: string }
  | { status: "unavailable"; reason: string }

export function getProductPurchaseState(product: HttpTypes.StoreProduct): ProductPurchaseState {
  if (!product || !product.variants || product.variants.length === 0) {
    return { status: "unavailable", reason: "Produto sem variantes" }
  }

  const isDemoPrice = (product.metadata?.is_demo_price as boolean) === true
  const priceApprovalStatus = product.metadata?.price_approval_status as string
  const isPricePending = product.metadata?.price_pending === true
  const purchaseEnabled = product.metadata?.purchase_enabled !== false
  const isQuoteOnly =
    product.metadata?.is_quote_only === true ||
    product.metadata?.commercial_status === "QUOTE_ONLY"

  if (isQuoteOnly) {
    return { status: "quote_only", reason: "Produto disponível somente sob consulta" }
  }

  if (!purchaseEnabled) {
    return { status: "unavailable", reason: "Compra desabilitada comercialmente" }
  }

  if (isPricePending || priceApprovalStatus === "pending" || isDemoPrice) {
    return { status: "price_pending", reason: "Preço em configuração" }
  }

  // Only positively priced variants with explicit availability can be sold.
  const pricedVariants = product.variants.filter((variant) => {
    const amount = variant.calculated_price?.calculated_amount
    return typeof amount === "number" && amount > 0
  })

  if (pricedVariants.length === 0) {
    return { status: "price_pending", reason: "Consulte o valor" }
  }

  const validVariants = pricedVariants.filter(isVariantInStock)

  if (validVariants.length === 0) {
    return { status: "out_of_stock", reason: "Sem estoque" }
  }

  if (validVariants.length > 1) {
    return { status: "select_variant", variants: validVariants }
  }

  const price = validVariants[0].calculated_price?.calculated_amount ?? 0
  return { status: "purchasable", variant: validVariants[0], price }
}
