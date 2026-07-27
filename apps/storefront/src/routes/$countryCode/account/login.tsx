import { createFileRoute, redirect } from "@tanstack/react-router"
import LoginPage from "@/pages/login"
import { sdk } from "@/lib/medusa"

export const Route = createFileRoute("/$countryCode/account/login")({
  beforeLoad: async ({ params }) => {
    // Check if already authenticated, redirect to home
    try {
      await sdk.store.customer.retrieve()
      // If successful, user is already logged in, redirect to proper country code
      throw redirect({ to: "/$countryCode", params: { countryCode: params.countryCode || "br" } })
    } catch (error: unknown) {
      // Re-throw redirect
      if ((error as Record<string, unknown>)?.to) throw error
      // Unauthorized errors are expected for login page - ignore them
      // Any other errors we also silently ignore to allow showing login page
    }
  },
  head: () => ({
    meta: [
      { title: "Login | FriggaFrio" },
      { name: "description", content: "Faça login na sua conta FriggaFrio para acessar preços, orçamentos e gerenciar seus pedidos." },
    ],
  }),
  component: LoginPage,
})
