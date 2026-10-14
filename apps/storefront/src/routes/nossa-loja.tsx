import { createFileRoute } from "@tanstack/react-router"
import { PublicStoresPage } from "@/pages/public-stores"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/nossa-loja")({
  component: PublicStoresPage,
  head: () => pageMeta({
    title: "Nossas lojas | FriggaFrio",
    description: "Conheça as três unidades FriggaFrio em São Paulo e Mogi Guaçu. Consulte os endereços, mapas e como chegar. Retirada gratuita exclusiva na Loja 1.",
    path: "/nossa-loja",
  }),
})
