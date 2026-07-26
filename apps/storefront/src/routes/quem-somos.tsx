import { createFileRoute } from "@tanstack/react-router"
import { QuemSomosPage } from "@/pages/quem-somos"

export const Route = createFileRoute("/quem-somos")({
  component: QuemSomosPage,
  head: () => {
    return {
      meta: [
        {
          title: "Quem Somos | FriggaFrio",
        },
        {
          name: "description",
          content: "Conheça a história da FriggaFrio, sua experiência no setor de refrigeração e climatização e os profissionais que fazem parte da empresa.",
        },
        {
          property: "og:title",
          content: "Quem Somos | FriggaFrio",
        },
        {
          property: "og:description",
          content: "Conheça a história da FriggaFrio, sua experiência no setor de refrigeração e climatização e os profissionais que fazem parte da empresa.",
        },
      ]
    }
  }
})
