import { createFileRoute, redirect } from "@tanstack/react-router"
import { DEFAULT_COUNTRY_CODE } from "@/config/commerce"
import AcceptInvitePage from "@/pages/accept-invite"
import { sdk } from "@/lib/medusa"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/account/accept-invite")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: typeof search.token === "string" ? search.token : undefined,
    }
  },
  beforeLoad: async () => {
    // Check if already authenticated, redirect to home
    try {
      await sdk.store.customer.retrieve()
      // If successful, user is already logged in
      throw redirect({ to: "/$countryCode", params: { countryCode: DEFAULT_COUNTRY_CODE } })
    } catch (error: any) {
      // Re-throw redirect
      if (error?.to) throw error
      // Unauthorized errors are expected - ignore them
    }
  },
  head: ({ params }) => pageMeta({
    title: "Aceitar convite | FriggaFrio",
    description: "Aceite o convite e conclua o cadastro da sua conta FriggaFrio.",
    path: `/${params.countryCode}/account/accept-invite`,
    indexable: false,
  }),
  component: AcceptInvitePage,
})
