import { createFileRoute } from "@tanstack/react-router"
import QuotesPage from "@/pages/quotes"
import AccountShell from "@/components/account-shell"

export const Route = createFileRoute("/$countryCode/quotes")({
  component: () => (
    <AccountShell>
      <QuotesPage />
    </AccountShell>
  ),
  head: () => {
    return {
      meta: [
        {
          title: "Quotes | FriggaFrio",
        },
        {
          name: "description",
          content: "View and manage your price quote requests.",
        },
      ],
    }
  },
})
