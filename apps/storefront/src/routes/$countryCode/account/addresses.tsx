import { createFileRoute, redirect } from "@tanstack/react-router"
import AddressesPage from "@/pages/addresses"
import AccountShell from "@/components/account-shell"
import { sdk } from "@/lib/medusa"
import { normalizeReturnTo } from "@/lib/auth/return-to"

function CustomerAddressesRoute() {
  return <AccountShell><AddressesPage /></AccountShell>
}

export const Route = createFileRoute("/$countryCode/account/addresses")({
  beforeLoad: async ({ params }) => {
    try { await sdk.store.customer.retrieve() } catch {
      const countryCode = params.countryCode || "br"
      const returnTo = normalizeReturnTo(`/${countryCode}/account/addresses`, countryCode)
      throw redirect({ to: "/$countryCode/account/login", params: { countryCode }, search: { returnTo } })
    }
  },
  component: CustomerAddressesRoute,
  head: () => ({ meta: [{ title: "Enderecos | FriggaFrio" }, { name: "description", content: "Gerencie seus enderecos salvos." }] }),
})
