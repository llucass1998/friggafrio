import { createFileRoute } from "@tanstack/react-router"
import QuotesPage from "@/pages/quotes"

export const Route = createFileRoute("/$countryCode/quotes")({
  component: QuotesPage,
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
