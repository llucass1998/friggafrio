import Home from "@/pages/home"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import { queryKeys } from "@/lib/utils/query-keys"
import { storeConfig } from "@/config/store"
import { absoluteSiteUrl, pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/")({
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    // Fetch region for the country code
    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    // Prefetch latest products for SSR (non-blocking)
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.latest(4, region.id),
      queryFn: () =>
        listProducts({
          query_params: {
            limit: 4,
            // This Medusa schema does not expose Product.created_at for ordering.
            order: "-id",
          },
          region_id: region.id,
        }),
    })

    return {
      countryCode,
      region,
    }
  },
  head: ({ loaderData }) => {
    const countryCode = loaderData?.countryCode || "br"
    const title = `${storeConfig.name} | Refrigeração e Climatização`
    const description = storeConfig.description

    return pageMeta({
      title,
      description,
      path: `/${countryCode || "br"}`,
      image: absoluteSiteUrl("/images/brand/logo-friggafrio-optimized.webp"),
    })
  },
  component: Home,
})
