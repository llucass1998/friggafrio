import { createFileRoute } from "@tanstack/react-router"
import TermosPage from "@/pages/support/termos"

export const Route = createFileRoute("/$countryCode/termos")({
  component: TermosPage,
  head: () => ({
    meta: [
      { title: "Termos de Uso | FriggaFrio" },
      {
        name: "description",
        content: "Termos de Uso FriggaFrio.",
      },
    ],
  }),
})
