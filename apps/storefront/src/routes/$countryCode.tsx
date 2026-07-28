import { createFileRoute, notFound, redirect, Outlet } from "@tanstack/react-router"
import { listRegions } from "@/lib/data/regions"

export const Route = createFileRoute("/$countryCode")({
  loader: async ({ params, context }) => {
    const { countryCode } = params

    // Explicit canonical enforcement for Brazil ONLY
    if (countryCode !== "br") {
      // If someone types /BR, we explicitly redirect to canonical /br
      if (countryCode.toLowerCase() === "br") {
        throw redirect({
          to: "/$countryCode",
          params: { countryCode: "br" },
        })
      }

      // Any other country code (us, dk, pt, null, undefined, etc.) results in a strict 404
      throw notFound()
    }

    const { queryClient } = context

    // Validate that the backend actually supports the 'br' region
    const regions = await queryClient.ensureQueryData({
      queryKey: ["regions"],
      queryFn: () => listRegions({ fields: "currency_code, *countries" }),
    })

    const isValidCountry = regions.some(
      region => region.countries?.some(
        country => country.iso_2 === "br"
      )
    )

    if (!isValidCountry) {
      throw notFound()
    }

    return { countryCode: "br" }
  },
  component: () => <Outlet />,
})
