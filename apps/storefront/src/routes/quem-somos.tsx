import { createFileRoute } from "@tanstack/react-router"
import { QuemSomosPage } from "@/pages/quem-somos"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/quem-somos")({
  component: QuemSomosPage,
  head: () =>
    pageMeta({
      title: "Quem Somos — Nossa história, experiência que gera confiança | FriggaFrio",
      description:
        "Conheça a história da FriggaFrio: tradição, excelência técnica e mais de 45 anos de atuação de Paulo Neulaender em refrigeração, climatização e sustentabilidade.",
      path: "/quem-somos",
    }),
})
