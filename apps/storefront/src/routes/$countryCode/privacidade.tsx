import { createFileRoute } from "@tanstack/react-router"
import PrivacidadePage from "@/pages/support/privacidade"

export const Route = createFileRoute("/$countryCode/privacidade")({
  component: PrivacidadePage,
  head: () => ({
    meta: [
      { title: "Política de Privacidade | FriggaFrio" },
      {
        name: "description",
        content: "Política de Privacidade FriggaFrio LGPD.",
      },
    ],
  }),
})
