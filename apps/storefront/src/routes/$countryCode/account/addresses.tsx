import { createFileRoute } from "@tanstack/react-router"
import AddressesPage from "@/pages/addresses"
import AccountShell from "@/components/account-shell"
import { pageMeta } from "@/lib/seo"

function CustomerAddressesRoute() {
  return <AccountShell><AddressesPage /></AccountShell>
}

export const Route = createFileRoute("/$countryCode/account/addresses")({
  beforeLoad: async () => undefined,
  component: CustomerAddressesRoute,
  head: ({ params }) => pageMeta({
    title: "Endereços | FriggaFrio",
    description: "Gerencie seus endereços salvos.",
    path: `/${params.countryCode}/account/addresses`,
    indexable: false,
  }),
})
