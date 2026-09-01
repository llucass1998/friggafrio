import { createFileRoute } from "@tanstack/react-router"
import QuotesPage from "@/pages/quotes"
import AccountShell from "@/components/account-shell"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/quotes")({
  component: () => (
    <AccountShell>
      <QuotesPage />
    </AccountShell>
  ),
  head: ({ params }) => pageMeta({
    title: "Orçamentos | FriggaFrio",
    description: "Consulte e acompanhe suas solicitações de orçamento.",
    path: `/${params.countryCode}/quotes`,
    indexable: false,
  }),
})
