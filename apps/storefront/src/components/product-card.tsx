import type { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { getProductPurchaseState } from "@/lib/utils/product-state"

type ProductCardProps = {
  product: HttpTypes.StoreProduct
  countryCode?: string
}

// Compatibility wrapper: the purchase state remains canonical while rendering
// is delegated to the shared public card used by every storefront surface.
// The shared state includes quote_only and price_pending fail-closed branches.
export function ProductCard({ product }: ProductCardProps) {
  getProductPurchaseState(product)
  return <PublicProductCard product={product} />
}

export default ProductCard
