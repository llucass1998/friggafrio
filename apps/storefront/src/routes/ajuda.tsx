import { createFileRoute } from "@tanstack/react-router"
import AjudaPage from "@/pages/support/ajuda"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/ajuda")({
  component: AjudaPage,
  head: () => pageMeta({
    title: "Central de Ajuda | FriggaFrio",
    description: "Dúvidas frequentes, suporte e atendimento FriggaFrio.",
    path: "/ajuda",
  }),
})
