import { createFileRoute } from "@tanstack/react-router"
import FavoritesPage from "@/pages/favorites"
import AccountShell from "@/components/account-shell"

export const Route = createFileRoute("/$countryCode/favorites")({
  component: () => (
    <AccountShell>
      <FavoritesPage />
    </AccountShell>
  ),
  head: () => ({
    meta: [
      { title: "Meus Favoritos | FriggaFrio" },
      { name: "description", content: "Produtos salvos para consultar depois." },
    ],
  }),
})
