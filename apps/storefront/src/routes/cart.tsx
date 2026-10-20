import { getStoredCountryCode } from "@/lib/data/country-code"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { siteFeatures } from "@/config/site-features"

export const Route = createFileRoute("/cart")({
  loader: async () => {
    const { countryCode } = await getStoredCountryCode()

    if (!siteFeatures.showCommerceActions) {
      throw redirect({
        to: "/$countryCode/store",
        params: { countryCode },
      })
    }

    throw redirect({
      to: "/$countryCode/cart",
      params: { countryCode },
    })
  },
})
