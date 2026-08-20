import { createFileRoute, notFound } from "@tanstack/react-router"
import { retrieveCategory } from "@/lib/data/categories"
import { listProducts } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import Category from "@/pages/category"
import { HttpTypes } from "@medusajs/types"
import { sanitize } from "@/lib/utils/sanitize"
import { z } from "zod"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"
import { clampPage, normalizePage, offsetForPage, PRODUCTS_PER_PAGE } from "@/lib/utils/pagination"

export const Route = createFileRoute("/$countryCode/categories/$handle")({
  validateSearch: z.object({
    page: z.preprocess((value) => normalizePage(value), z.number().int().min(1)).optional(),
  }),
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: async ({ params, context, deps }) => {
    const { countryCode, handle } = params
    const { queryClient } = context

    // Pre-fetch region data
    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region || !handle) {
      throw notFound()
    }

    // Fetch category by handle
    const category = await queryClient.ensureQueryData({
      queryKey: ["category", handle],
      queryFn: async () => {
        try {
          return await retrieveCategory({ handle })
        } catch {
          throw notFound()
        }
      },
    })

    if (!category) {
      throw notFound()
    }

    const pageSize = PRODUCTS_PER_PAGE
    const page = deps.page ?? 1
    const firstPage = await queryClient.ensureQueryData({
      queryKey: ["products", { region_id: region.id, category_id: category.id, page }],
      queryFn: () => listProducts({
        query_params: {
          limit: pageSize,
          offset: offsetForPage(page, pageSize),
          // Use the canonical Medusa id as a total ordering for stable offsets.
          order: "id",
          category_id: [category.id],
          fields: PUBLIC_PRODUCT_CARD_FIELDS,
        },
        region_id: region.id,
      }),
    })

    const normalizedPage = clampPage(page, firstPage.count, pageSize)
    const productPage = normalizedPage === page
      ? firstPage
      : await queryClient.ensureQueryData({
          queryKey: ["products", { region_id: region.id, category_id: category.id, page: normalizedPage }],
          queryFn: () => listProducts({
            query_params: {
              limit: pageSize,
              offset: offsetForPage(normalizedPage, pageSize),
              order: "id",
              category_id: [category.id],
              fields: PUBLIC_PRODUCT_CARD_FIELDS,
            },
            region_id: region.id,
          }),
        })

    return sanitize({
      countryCode,
      region,
      category: category as HttpTypes.StoreProductCategory,
      products: productPage.products as HttpTypes.StoreProduct[],
      count: productPage.count,
      page: normalizedPage,
      pageSize,
    })
  },
  head: ({ loaderData }) => {
    const { region, countryCode, category } =
      loaderData || {}
    const regionName = region?.name || countryCode?.toUpperCase()
    const categoryName = category?.name || "Category"
    const title = `${categoryName} - ${regionName} | FriggaFrio`
    const description = `Shop FriggaFrio's ${categoryName.toLowerCase()} category available in ${regionName}.`

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
  component: Category,
})
