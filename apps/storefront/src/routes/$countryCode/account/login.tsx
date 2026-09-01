import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import LoginPage from "@/pages/login"
import { sdk } from "@/lib/medusa"
import { normalizeReturnTo } from "@/lib/auth/return-to"
import { ADMIN_ACCESS_URL } from "@/lib/auth/admin-access"
import { pageMeta } from "@/lib/seo"

const loginSearchSchema = z.object({
  returnTo: z.string().optional(),
  google_error: z.string().optional(),
})

export const Route = createFileRoute("/$countryCode/account/login")({
  beforeLoad: async ({ params, search }) => {
    // Check if already authenticated, redirect to the validated destination.
    try {
      await sdk.store.customer.retrieve()
      const countryCode = params.countryCode || "br"
      const returnTo = normalizeReturnTo(search.returnTo, countryCode)
      throw redirect({ href: returnTo })
    } catch (error: any) {
      if (error?.to || error?.href) throw error
    }

    // Admin sessions use the same public entrypoint but continue to the dashboard.
    try {
      const session = await sdk.client.fetch<{ redirect_to?: string | null }>(
        "/store/auth/session",
        { method: "GET" },
      )
      if (session.redirect_to === "/app") {
        throw redirect({ href: ADMIN_ACCESS_URL ?? "/app" })
      }
    } catch (error: any) {
      if (error?.to || error?.href) throw error
    }
  },
  validateSearch: loginSearchSchema,
  head: ({ params }) => pageMeta({
    title: "Login | FriggaFrio",
    description: "Faça login na sua conta FriggaFrio para acessar preços, orçamentos e gerenciar seus pedidos.",
    path: `/${params.countryCode}/account/login`,
    indexable: false,
  }),
  component: LoginPage,
})
