import { sdk } from "@/lib/medusa"
import { cache } from "react"
import type { HttpTypes } from "@medusajs/types"
import { PUBLIC_HOME_PRODUCT_FIELDS } from "@/lib/data/product-fields"
import type { CatalogFilters } from "@/lib/utils/catalog-filters"
import { buildCatalogSearchQuery } from "@/lib/utils/catalog-query"
// import { getAuthHeaders } from "./cookies" // Unused and missing

export const listProducts = cache(
  async ({
    pageParam = 1,
    queryParams,
    query_params, // For compatibility
    regionId,
    region_id, // For compatibility
  }: {
    pageParam?: number
    queryParams?: any
    query_params?: any
    countryCode?: string
    regionId?: string
    region_id?: string
  }) => {
    const qParams = queryParams || query_params || {}
    const rId = regionId || region_id
    
    const limit = qParams.limit || 12
    const offset = (pageParam - 1) * limit
    
    const storeParams: any = {
      limit,
      offset,
      region_id: rId,
      ...qParams,
    }
    
    return sdk.store.product
      .list(storeParams, { next: { tags: ["products"] } }) 
      .then(({ products, count }) => {
        return {
          response: { products, count },
          products, // Return products directly for compatibility
          count,
          nextPage: count > offset + limit ? pageParam + 1 : null,
          queryParams: storeParams,
        }
      })
      .catch(() => {
        // Logging silenced for production
        return { response: { products: [], count: 0 }, products: [], count: 0, nextPage: null, queryParams: storeParams }
      })
  }
)

/**
 * Fetches catalog facets from the backend without downloading products. The
 * endpoint intentionally returns only values that are present in the current
 * region/catalog snapshot, so controls never advertise unsupported filters.
 */
export const getCatalogFacets = cache(async ({
  regionId,
  filters,
}: {
  regionId: string
  filters?: Pick<CatalogFilters, "category" | "q" | "brand" | "availability" | "price_min" | "price_max" | "promotion" | "option_value_id">
}) => {
  const query: Record<string, string> = {}
  const normalizedRegionId = regionId.trim()
  if (normalizedRegionId) query.region_id = normalizedRegionId

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === false || value === null) continue
      if (Array.isArray(value)) {
        const values = value.map((item) => String(item).trim()).filter(Boolean)
        if (values.length > 0) query[key] = values.join(",")
        continue
      }
      const normalized = String(value).trim()
      if (normalized) query[key] = normalized
    }
  }

  try {
    return await sdk.client.fetch<{
      brands: Array<{ id: string; name: string; count?: number }>
      price: { min?: number; max?: number }
      promotion_available?: boolean
      options: Array<{ id: string; title: string; values: Array<{ id: string; value: string; count?: number }> }>
    }>("/store/catalog/facets", { method: "GET", query })
  } catch {
    return {
      brands: [] as Array<{ id: string; name: string; count?: number }>,
      price: {} as { min?: number; max?: number },
      promotion_available: false,
      options: [] as Array<{ id: string; title: string; values: Array<{ id: string; value: string; count?: number }> }>,
    }
  }
})

export type CatalogSearchResponse = { product_ids: string[]; count: number; unavailable?: boolean; code?: string; limit?: number }

/** Applies catalog-only filters before pagination in the backend adapter. */
export const searchCatalog = cache(async ({
  regionId,
  filters,
  limit = 24,
  offset = 0,
}: {
  regionId: string
  filters?: Record<string, unknown>
  limit?: number
  offset?: number
}): Promise<CatalogSearchResponse> => {
  const query = buildCatalogSearchQuery({ regionId, filters, limit, offset })
  try {
    return await sdk.client.fetch<CatalogSearchResponse>("/store/catalog/search", { method: "GET", query })
  } catch (error) {
    return {
      product_ids: [],
      count: 0,
      unavailable: true,
      code: error instanceof Error ? error.message : "CATALOG_QUERY_UNAVAILABLE",
    }
  }
})

export const retrieveProduct = cache(
  async (params: any, additionalArgs?: any) => {
    // If it's a string, it's an ID
    if (typeof params === "string") {
      return sdk.store.product.retrieve(params, { region_id: additionalArgs }, { next: { tags: ["products"] } })
    }
    
    // If it's an object with a handle, we need to list by handle
    if (params && params.handle) {
      const { products } = await sdk.store.product.list({
        handle: params.handle,
        region_id: params.region_id,
        fields: params.fields,
      }, { next: { tags: ["products"] } })
      
      if (!products || products.length === 0) {
        throw new Error(`Product with handle ${params.handle} not found`)
      }
      return products[0]
    }
    
    // If it's an object with an ID
    if (params && params.id) {
      return sdk.store.product.retrieve(params.id, { 
        region_id: params.region_id,
        fields: params.fields 
      }, { next: { tags: ["products"] } })
    }
    
    throw new Error("Invalid parameters for retrieveProduct")
  }
)

export const getProductByHandle = cache(
  async (handle: string, regionId: string) => {
    return sdk.store.product.list({
      handle,
      region_id: regionId,
    }).then(({ products }) => products[0])
  }
)

export type BestSellersResponse = {
  available?: boolean
  products?: Array<{ id?: string }>
}

export type HomeProductSelectionResponse = {
  source: "sales-ranking-30d" | "featured-inventory-fallback"
  generatedAt: string
  products: Array<{ id?: string }>
}

export const getHomeProductSelection = cache(async (
  regionId: string,
  { excludedProductIds = [] }: { excludedProductIds?: readonly string[] } = {},
): Promise<{
  source: HomeProductSelectionResponse["source"]
  products: HttpTypes.StoreProduct[]
}> => {
  try {
    const selection = await sdk.client.fetch<HomeProductSelectionResponse>(
      "/store/catalog/home-products",
      {
        method: "GET",
        query: excludedProductIds.length > 0
          ? { exclude_ids: excludedProductIds.join(",") }
          : undefined,
      },
    )
    const ids = selection.products.map((product) => product.id?.trim()).filter((id): id is string => Boolean(id))
    if (ids.length === 0) return { source: selection.source, products: [] }
    const { products } = await sdk.store.product.list({
      id: ids,
      region_id: regionId,
      fields: PUBLIC_HOME_PRODUCT_FIELDS,
    }, { next: { tags: ["products", "home-selection"] } })
    const byId = new Map(products.map((product) => [product.id, product]))
    return { source: selection.source, products: ids.map((id) => byId.get(id)).filter((product): product is (typeof products)[number] => Boolean(product)) }
  } catch {
    return { source: "featured-inventory-fallback", products: [] }
  }
})

/** Loads only the backend's validated ranking; unavailable rankings stay empty. */
export const listBestSellerProducts = cache(async (regionId: string) => {
  try {
    const ranking = await sdk.client.fetch<BestSellersResponse>(
      "/store/catalog/best-sellers",
      { method: "GET" },
    )
    if (!ranking.available || !Array.isArray(ranking.products)) return []

    const ids = ranking.products
      .map((product) => product.id?.trim())
      .filter((id): id is string => Boolean(id))
    if (ids.length === 0) return []

    const { products } = await sdk.store.product.list({
      id: ids,
      region_id: regionId,
    }, { next: { tags: ["products", "best-sellers"] } })
    const byId = new Map(products.map((product) => [product.id, product]))
    return ids.map((id) => byId.get(id)).filter((product): product is (typeof products)[number] => Boolean(product))
  } catch {
    return []
  }
})
