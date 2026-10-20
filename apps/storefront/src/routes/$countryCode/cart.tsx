import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import Cart from "@/pages/cart"
import { getRegion } from "@/lib/data/regions"
import { pageMeta } from "@/lib/seo"
import { siteFeatures } from "@/config/site-features"

export const Route = createFileRoute("/$countryCode/cart")({
  loader: async ({ params, context }) => {
    const { countryCode } = params

    // Durante a fase institucional, compras online estão desativadas.
    // Redireciona o acesso ao carrinho diretamente para o catálogo.
    if (!siteFeatures.showCommerceActions) {
      throw redirect({
        to: "/$countryCode/store",
        params: { countryCode },
      })
    }

    const { queryClient } = context

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    return {
      region,
      countryCode,
    }
  },
  head: ({ params }) => pageMeta({
    title: "Carrinho | FriggaFrio",
    description: "Revise os itens do seu carrinho FriggaFrio.",
    path: `/${params.countryCode}/cart`,
    indexable: false,
  }),
  component: Cart,
})
