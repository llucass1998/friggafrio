import { createFileRoute, notFound, Outlet } from "@tanstack/react-router"
import { listRegions } from "@/lib/data/regions"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import { resolveStoreRegion } from "@/lib/utils/region"

export const Route = createFileRoute("/$countryCode")({
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context

    // Get all regions to validate country code
    const regions = await queryClient.ensureQueryData({
      queryKey: ["regions"],
      queryFn: () => listRegions({ fields: "currency_code, *countries" }),
    })

    if (countryCode.toLowerCase() !== DEFAULT_COUNTRY_CODE) {
      throw notFound()
    }

    resolveStoreRegion(regions, countryCode)

    return { countryCode: DEFAULT_COUNTRY_CODE }
  },
  component: () => <Outlet />,
})
