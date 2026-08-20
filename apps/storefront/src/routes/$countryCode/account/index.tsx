import { createFileRoute, redirect } from "@tanstack/react-router"
import { z } from "zod"
import SettingsPage from "@/pages/settings"
import AccountShell from "@/components/account-shell"
import { sdk } from "@/lib/medusa"
import { normalizeReturnTo } from "@/lib/auth/return-to"

const settingsSearchSchema = z.object({
  tab: z.string().optional(),
})

function AccountOverviewRoute() {
  return (
    <AccountShell>
      <SettingsPage />
    </AccountShell>
  )
}

export const Route = createFileRoute("/$countryCode/account/")({
  beforeLoad: async ({ params, search }) => {
    try {
      await sdk.store.customer.retrieve()
    } catch {
      // Not authenticated, redirect to login
      const countryCode = params.countryCode || "br"
      const tab = typeof search.tab === "string" ? `?tab=${encodeURIComponent(search.tab)}` : ""
      const returnTo = normalizeReturnTo(`/${countryCode}/account${tab}`, countryCode)
      throw redirect({
        to: "/$countryCode/account/login",
        params: { countryCode },
        search: { returnTo },
      })
    }
  },
  validateSearch: settingsSearchSchema,
  component: AccountOverviewRoute,
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
