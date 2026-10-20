import { createFileRoute, notFound, redirect } from "@tanstack/react-router"
import Checkout from "@/pages/checkout"
import { getRegion } from "@/lib/data/regions"
import { CheckoutStepKey } from "@/lib/types/global"
import { sanitize } from "@/lib/utils/sanitize"
import { pageMeta } from "@/lib/seo"
import { siteFeatures } from "@/config/site-features"

export const Route = createFileRoute("/$countryCode/checkout")({
  validateSearch: (search): { step: CheckoutStepKey } => {
    let step = search.step
    if (!Object.values(CheckoutStepKey).includes(step as CheckoutStepKey)) {
      step = CheckoutStepKey.ADDRESSES
    }
    return {
      step: step as CheckoutStepKey,
    }
  },
  loaderDeps: ({ search: { step } }) => {
    return {
      step,
    }
  },
  loader: async ({ params, context, deps }) => {
    const { countryCode } = params

    // Durante a fase institucional, o checkout online está desativado.
    // Redireciona acessos diretos ao checkout para o catálogo.
    if (!siteFeatures.showCommerceActions) {
      throw redirect({
        to: "/$countryCode/store",
        params: { countryCode },
      })
    }

    const { queryClient } = context
    const { step } = deps

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    return sanitize({
      region,
      countryCode,
      step,
    })
  },
  head: ({ params }) => pageMeta({
    title: "Finalizar compra | FriggaFrio",
    description: "Conclua sua compra com as opções de entrega e retirada da FriggaFrio.",
    path: `/${params.countryCode}/checkout`,
    indexable: false,
  }),
  component: Checkout,
})
