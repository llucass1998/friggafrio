import { createFileRoute } from "@tanstack/react-router"
import PrivacidadePage from "@/pages/support/privacidade"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/privacidade")({
  component: PrivacidadePage,
  head: () => pageMeta({
    title: "Política de Privacidade | FriggaFrio",
    description: "Política de Privacidade FriggaFrio e informações sobre tratamento de dados.",
    path: "/privacidade",
  }),
})
