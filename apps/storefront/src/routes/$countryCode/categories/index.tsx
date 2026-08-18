import { createFileRoute, notFound } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import { listCategories } from "@/lib/data/categories"
import CategoriesPage from "@/pages/categories"
import { sanitize } from "@/lib/utils/sanitize"

export const Route = createFileRoute("/$countryCode/categories/")({
  loader: async ({ params, context }) => {
    const { countryCode } = params
    const { queryClient } = context
    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })
    if (!region) throw notFound()

    const categories = await queryClient.ensureQueryData({
      queryKey: ["categories", { storefront: true }],
      queryFn: () => listCategories({ queryParams: { limit: 100, offset: 0 } }),
    })

    return sanitize({ countryCode, region, categories })
  },
  component: CategoriesPage,
})
