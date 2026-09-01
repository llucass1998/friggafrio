import { createFileRoute } from "@tanstack/react-router"
import FavoritesPage from "@/pages/favorites"
import AccountShell from "@/components/account-shell"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/favorites")({
  component: () => (
    <AccountShell>
      <FavoritesPage />
    </AccountShell>
  ),
  head: ({ params }) => pageMeta({
    title: "Meus Favoritos | FriggaFrio",
    description: "Produtos salvos para consultar depois.",
    path: `/${params.countryCode}/favorites`,
    indexable: false,
  }),
})
