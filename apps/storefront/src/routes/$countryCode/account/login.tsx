import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import LoginPage from "@/pages/login"
import { sdk } from "@/lib/medusa"
import { normalizeReturnTo } from "@/lib/auth/return-to"

const loginSearchSchema = z.object({
  returnTo: z.string().optional(),
})

export const Route = createFileRoute("/$countryCode/account/login")({
  beforeLoad: async ({ params, search }) => {
    // Check if already authenticated, redirect to the validated destination.
    try {
      await sdk.store.customer.retrieve()
      // If successful, user is already logged in, redirect to proper country code
      const countryCode = params.countryCode || "br"
      const returnTo = normalizeReturnTo(search.returnTo, countryCode)
      throw redirect({ href: returnTo })
    } catch (error: any) {
      // Re-throw redirect
      if (error?.to || error?.href) throw error
      // Unauthorized errors are expected for login page - ignore them
      // Any other errors we also silently ignore to allow showing login page
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
