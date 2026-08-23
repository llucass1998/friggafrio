import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import LoginPage from "@/pages/login"
import { sdk } from "@/lib/medusa"
import { normalizeReturnTo } from "@/lib/auth/return-to"
import { ADMIN_ACCESS_URL } from "@/lib/auth/admin-access"

const loginSearchSchema = z.object({
  returnTo: z.string().optional(),
})

export const Route = createFileRoute("/$countryCode/account/login")({
  beforeLoad: async ({ params, search }) => {
    // This public status endpoint keeps anonymous login navigation free of
    // expected 401 responses from protected Customer/Admin endpoints.
    try {
      const status = await sdk.client.fetch<{
        authenticated: boolean
        actor: "customer" | "user" | null
        redirect_to?: "/app"
      }>("/store/auth/status", { method: "GET" })
      const countryCode = params.countryCode || "br"
      if (status.authenticated && status.actor === "user" && status.redirect_to === "/app") {
        throw redirect({ href: ADMIN_ACCESS_URL ?? "/app" })
      }
      if (status.authenticated && status.actor === "customer") {
        throw redirect({ href: normalizeReturnTo(search.returnTo, countryCode) })
      }
    } catch (error: unknown) {
      if (typeof error === "object" && error !== null && ("to" in error || "href" in error)) throw error
    }
  },
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [
      { title: "Login | FriggaFrio" },
      { name: "description", content: "Faça login na sua conta FriggaFrio para acessar preços, orçamentos e gerenciar seus pedidos." },
    ],
  }),
  component: LoginPage,
})
