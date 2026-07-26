import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import SettingsPage from "@/pages/settings"
import { sdk } from "@/lib/medusa"

const settingsSearchSchema = z.object({
  tab: z.string().optional(),
})

export const Route = createFileRoute("/$countryCode/account/")({
  beforeLoad: async ({ params }) => {
    try {
      await sdk.store.customer.retrieve()
    } catch (_error: unknown) {
      // Not authenticated, redirect to login
      throw redirect({ to: "/$countryCode/account/login", params: { countryCode: params.countryCode || "br" } })
    }
  },
  validateSearch: settingsSearchSchema,
  component: SettingsPage,
  head: () => {
    return {
      meta: [
        {
          title: "Minha Conta | FriggaFrio",
        },
        {
          name: "description",
          content: "Gerencie seu perfil e pedidos.",
        },
      ],
    }
  },
})