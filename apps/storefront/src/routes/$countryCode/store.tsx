import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import Store from "@/pages/store"
import { listProducts } from "@/lib/data/products"
import { retrieveCategory } from "@/lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import { sanitize } from "@/lib/utils/sanitize"
import { z } from "zod"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"
import { clampPage, normalizePage, offsetForPage, PRODUCTS_PER_PAGE } from "@/lib/utils/pagination"

const storeSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().trim().optional(),
  sort: z.enum(["-id", "id", "title", "-title"]).optional(),
  page: z.preprocess((value) => normalizePage(value), z.number().int().min(1)).optional(),
  [OPTION_VALUE_QUERY_KEY]: z
    .union([z.string(), z.array(z.string())])
    .optional(),
})

export const Route = createFileRoute("/$countryCode/store")({
  validateSearch: storeSearchSchema,
  loaderDeps: ({ search }) => ({
    optionValueIds: search[OPTION_VALUE_QUERY_KEY],
    category: search.category,
    q: search.q,
    sort: search.sort,
    page: search.page,
  }),
  loader: async ({ params, context, deps }) => {
    const { countryCode } = params
    const { queryClient } = context
    const rawOptionValueIds = deps.optionValueIds
    const category = deps.category
    const requestedPage = deps.page ?? 1
    const q = deps.q
    const sort = deps.sort ?? "-id"
    const optionValueIds = Array.isArray(rawOptionValueIds)
      ? rawOptionValueIds
      : rawOptionValueIds
        ? [rawOptionValueIds]
        : []

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    // Legacy navigation still carries category handles in the store query.
    // Resolve them to canonical Medusa IDs before applying the server filter.
    const categoryId = category
      ? await queryClient.ensureQueryData({
          queryKey: ["category", category],
          queryFn: async () => {
            try {
              return (await retrieveCategory({ handle: category }))?.id ?? null
            } catch {
              return category.startsWith("pcat_") ? category : null
            }
          },
        })
      : undefined

    const queryParams = {
      limit: PRODUCTS_PER_PAGE,
      offset: offsetForPage(requestedPage, PRODUCTS_PER_PAGE),
      // Medusa's created_at ordering is not a total order: equal timestamps
      // can move rows between offsets and duplicate pagination pages.
      order: sort,
      fields: PUBLIC_PRODUCT_CARD_FIELDS,
      ...(q ? { q } : {}),
      ...(optionValueIds.length > 0 ? { option_value_id: optionValueIds } : {}),
      ...(categoryId ? { category_id: [categoryId] } : category ? { category_id: ["__missing_category__"] } : {}),
    }

    const firstPage = await queryClient.ensureQueryData({
      // Keep every server-side filter in the key so a category navigation
      // cannot reuse the unfiltered catalog snapshot during hydration.
      queryKey: ["products", { region_id: region.id, category: categoryId, optionValueIds, q, sort, page: requestedPage }],
      queryFn: () => listProducts({ queryParams, regionId: region.id }),
    })

    // A stale/shared link may point past the end of the catalog. Fetch the
    // deterministic last page rather than rendering a confusing empty grid.
    const page = clampPage(requestedPage, firstPage.count, PRODUCTS_PER_PAGE)
    const { products, count } = page === requestedPage
      ? firstPage
      : await queryClient.ensureQueryData({
          queryKey: ["products", { region_id: region.id, category: categoryId, optionValueIds, q, sort, page }],
          queryFn: () => listProducts({
            queryParams: { ...queryParams, offset: offsetForPage(page, PRODUCTS_PER_PAGE) },
            regionId: region.id,
          }),
        })

    return sanitize({
      countryCode,
      region,
      products: products as HttpTypes.StoreProduct[],
      count,
      page,
      pageSize: PRODUCTS_PER_PAGE,
      optionValueIds,
      category,
      categoryId,
    })
  },
  head: ({ loaderData }) => {
    const { region, countryCode } = loaderData || {}
    const regionName = region?.name || countryCode?.toUpperCase()
    const title = `Shop All Products - ${regionName} | FriggaFrio`
    const description = `Browse FriggaFrio's complete collection of industrial equipment and parts available in ${regionName}.`

    return {
      meta: [
        {
          title,
        },
        {
          name: "description",
          content: description,
        },
        {
          property: "og:title",
          content: title,
        },
        {
          property: "og:description",
          content: description,
        },
        {
          property: "og:type",
          content: "website",
        },
        {
          property: "twitter:card",
          content: "summary_large_image",
        },
        {
          property: "twitter:title",
          content: title,
        },
        {
          property: "twitter:description",
          content: description,
        },
      ]
    }
  },
  component: Store,
})
