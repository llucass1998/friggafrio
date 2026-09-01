import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { queryKeys } from "@/lib/utils/query-keys"
import { sdk } from "@/lib/medusa"
import { PUBLIC_PRODUCT_CARD_FIELDS, PUBLIC_PRODUCT_DETAIL_FIELDS } from "@/lib/data/product-fields"
import { getRelatedProducts } from "@/lib/data/related-products"

type ProductListQueryParams = HttpTypes.StoreProductListParams & {
  option_value_id?: string | string[]
}

export const useProducts = ({
  query_params,
  region_id,
  initial_page = 1,
}: {
  query_params?: ProductListQueryParams
  region_id?: string
  initial_page?: number
} = {}) => {
  const initialPage = Math.max(1, Math.floor(initial_page || 1))

  return useInfiniteQuery({
    queryKey: queryKeys.products.list(query_params, region_id, initialPage),
    queryFn: async ({ pageParam }) => {
      const limit = query_params?.limit || 12
      const _page_param = Math.max(pageParam, 1)
      const offset = _page_param === 1 ? 0 : (_page_param - 1) * limit

      const response = await sdk.store.product.list({
        limit,
        offset,
        region_id,
        fields: query_params?.fields || PUBLIC_PRODUCT_CARD_FIELDS,
        ...query_params,
      } as HttpTypes.StoreProductListParams)

      const next_page = offset + limit < response.count ? _page_param + 1 : null

      return {
        products: response.products,
        count: response.count,
        next_page,
      }
    },
    getNextPageParam: (lastPage) => lastPage.next_page,
    getPreviousPageParam: (firstPage) => firstPage.next_page,
    initialPageParam: initialPage,
    enabled: !!region_id,
  })
}

export const useProduct = ({
  handle,
  region_id,
  fields,
}: {
  handle: string;
  region_id?: string;
  fields?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.products.detail(handle, region_id),
    queryFn: async () => {
      const { products } = await sdk.store.product.list({
        handle: handle,
        region_id,
        fields: fields || PUBLIC_PRODUCT_DETAIL_FIELDS,
      })

      if (!products || products.length === 0) {
        throw new Error(`Product with handle ${handle} not found`)
      }

      return products[0]
    },
    enabled: !!handle && !!region_id,
  })
}

export const useRelatedProducts = ({
  product,
  region_id,
}: {
  product: HttpTypes.StoreProduct;
  region_id?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.products.related(product.id, region_id),
    queryFn: () => getRelatedProducts(product, region_id!),
    enabled: Boolean(product.id) && !!region_id,
  })
}

export const useLatestProducts = ({
  limit = 4,
  region_id,
}: {
  limit?: number
  region_id?: string
} = {}) => {
  return useQuery({
    queryKey: queryKeys.products.latest(limit, region_id),
    queryFn: async () => {
      const response = await sdk.store.product.list({
        limit,
        offset: 0,
        order: "-created_at",
        region_id,
        fields: PUBLIC_PRODUCT_CARD_FIELDS,
      })

      return {
        products: response.products,
        count: response.count,
        next_page: null,
      }
    },
    enabled: !!region_id,
  })
}
