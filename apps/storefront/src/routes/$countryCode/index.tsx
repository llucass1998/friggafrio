import Home from "@/pages/home"
import { createFileRoute } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import { queryKeys } from "@/lib/utils/query-keys"
import { storeConfig } from "@/config/store"

export const Route = createFileRoute("/$countryCode/")({
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    // Fetch region for the country code
    // If backend is unavailable, fallback gracefully so the page still renders
    let region: Awaited<ReturnType<typeof getRegion>> | null = null
    try {
      region = await queryClient.ensureQueryData({
        queryKey: ["region", countryCode],
        queryFn: () => getRegion({ country_code: countryCode }),
      })
    } catch (_err) {
      // Backend unavailable — render the page without region data
      // Components handle their own loading/error states
      return { countryCode, region: null }
    }

    if (!region) {
      // Backend unavailable or region not configured yet — render the page
      // without region data so users still see the storefront (same graceful
      // degradation pattern used in $countryCode.tsx parent loader)
      return { countryCode, region: null }
    }

    // Prefetch latest products for SSR (non-blocking)
    queryClient.prefetchQuery({
      queryKey: queryKeys.products.latest(4, region.id),
      queryFn: () =>
        listProducts({
          query_params: {
            limit: 4,
            order: "-created_at",
          },
          region_id: region!.id,
        }),
    })

    return {
      countryCode,
      region,
    }
  },
  head: () => {
    const title = `${storeConfig.name} | Refrigeração e Climatização`
    const description = storeConfig.description

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
  component: Home,
})
