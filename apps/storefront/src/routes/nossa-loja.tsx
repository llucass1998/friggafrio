import { createFileRoute } from "@tanstack/react-router"
import { PublicStoresPage } from "@/pages/public-stores"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/nossa-loja")({
  component: PublicStoresPage,
  head: () => pageMeta({
    title: "Nossa Loja | FriggaFrio",
    description: "Visite a FriggaFrio em Campos Elíseos, São Paulo. Consulte o endereço e os canais de atendimento.",
    path: "/nossa-loja",
  }),
})
