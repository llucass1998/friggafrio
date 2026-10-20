import { getStoredCountryCode } from "@/lib/data/country-code"
import { CheckoutStepKey } from "@/lib/types/global"
import { createFileRoute, redirect } from "@tanstack/react-router"
import { siteFeatures } from "@/config/site-features"

export const Route = createFileRoute("/checkout")({
  loader: async () => {
    const { countryCode } = await getStoredCountryCode()

    if (!siteFeatures.showCommerceActions) {
      throw redirect({
        to: "/$countryCode/store",
        params: { countryCode },
      })
    }

    throw redirect({
      to: "/$countryCode/checkout",
      search: { step: CheckoutStepKey.ADDRESSES },
      params: { countryCode },
    })
  },
})
