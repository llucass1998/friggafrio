import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import SettingsPage from "@/pages/settings"
import AccountShell from "@/components/account-shell"
import { pageMeta } from "@/lib/seo"

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
  // AccountShell performs the authenticated client-side guard. Keeping the
  // route load side-effect free avoids false SSR redirects without cookies.
  beforeLoad: async () => undefined,
  validateSearch: settingsSearchSchema,
  component: AccountOverviewRoute,
  head: ({ params }) => pageMeta({
    title: "Minha Conta | FriggaFrio",
    description: "Gerencie seu perfil e pedidos.",
    path: `/${params.countryCode}/account`,
    indexable: false,
  }),
})
