import { sdk } from "@/lib/medusa"

import { cache } from "react"
// import { getAuthHeaders } from "@/lib/data/cookies" // Unused and missing

export const listProducts = cache(
  async ({
    pageParam = 1,
    queryParams,
    query_params, // For compatibility
    countryCode: _countryCode,
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
      .catch((_error) => {
        // Logging silenced for production
        return { response: { products: [], count: 0 }, products: [], count: 0, nextPage: null, queryParams: storeParams }
      })
  }
)

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
