import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import Store from "@/pages/store"
import { listAndSortProducts } from "@/lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { sanitize } from "@/lib/utils/sanitize"
import { z } from "zod"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"

const storeSearchSchema = z.object({
  category: z.string().optional(),
  [OPTION_VALUE_QUERY_KEY]: z
    .union([z.string(), z.array(z.string())])
    .optional(),
})

export const Route = createFileRoute("/$countryCode/store")({
  validateSearch: storeSearchSchema,
  loaderDeps: ({ search }) => ({
    optionValueIds: search[OPTION_VALUE_QUERY_KEY],
  }),
  loader: async ({ params, context, deps }) => {
    const { countryCode } = params
    const { queryClient } = context
    const rawOptionValueIds = deps.optionValueIds
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

    const { products } = await queryClient.ensureQueryData({
      queryKey: ["products", { region_id: region.id, optionValueIds }],
      queryFn: () => listAndSortProducts({
        query_params: {
          limit: 100,
          order: "-created_at",
          fields: "*variants.calculated_price,*categories,*variants.options"
        },
        region_id: region.id,
        optionValueIds,
      }),
    })

    return sanitize({
      countryCode,
      region,
      products: products as HttpTypes.StoreProduct[],
      optionValueIds,
    })
  },
  head: ({ loaderData }) => {
    const { region, countryCode } = loaderData || {}
    const regionName = region?.name || countryCode?.toUpperCase()
    const title = `Shop All Products - ${regionName} | ProLift Equipment`
    const description = `Browse ProLift's complete collection of industrial equipment and parts available in ${regionName}.`

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