import type { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/medusa"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"
import { rankRelatedProducts } from "@/lib/utils/related-products"

export const RELATED_PRODUCT_FIELDS = `id,title,subtitle,description,handle,thumbnail,metadata,*categories,*type,*collection,*tags,*images,*variants.calculated_price,+variants.inventory_quantity,+variants.manage_inventory,+variants.allow_backorder,*variants.options`

export async function getRelatedProducts(product: HttpTypes.StoreProduct, regionId: string, limit = 4): Promise<HttpTypes.StoreProduct[]> {
  const categoryIds = product.categories?.map((c) => c.id).filter(Boolean) as string[] | undefined

  const response = await sdk.store.product.list({
    region_id: regionId,
    category_id: categoryIds && categoryIds.length > 0 ? categoryIds : undefined,
    collection_id: !categoryIds?.length && product.collection_id ? [product.collection_id] : undefined,
    limit: 12,
    offset: 0,
    is_giftcard: false,
    fields: PUBLIC_PRODUCT_CARD_FIELDS,
  }).catch(() => ({ products: [] as HttpTypes.StoreProduct[] }))

  return rankRelatedProducts(product, response.products, limit)
}
