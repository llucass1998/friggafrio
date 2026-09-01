import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"
import { rankRelatedProducts } from "@/lib/utils/related-products"

export const RELATED_PRODUCT_FIELDS = `id,title,subtitle,description,handle,thumbnail,metadata,*categories,*type,*collection,*tags,*images,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options`

export async function getRelatedProducts(product: HttpTypes.StoreProduct, regionId: string, limit = 4): Promise<HttpTypes.StoreProduct[]> {
  const response = await sdk.store.product.list({
    region_id: regionId,
    limit: 100,
    offset: 0,
    is_giftcard: false,
    fields: RELATED_PRODUCT_FIELDS || PUBLIC_PRODUCT_CARD_FIELDS,
  })
  return rankRelatedProducts(product, response.products, limit)
}
