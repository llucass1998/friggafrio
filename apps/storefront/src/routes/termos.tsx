import { createFileRoute } from "@tanstack/react-router"
import TermosPage from "@/pages/support/termos"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/termos")({
  component: TermosPage,
  head: () => pageMeta({
    title: "Termos de Uso | FriggaFrio",
    description: "Termos de Uso FriggaFrio.",
    path: "/termos",
  }),
})
