import { createFileRoute } from "@tanstack/react-router"
import AjudaPage from "@/pages/support/ajuda"

export const Route = createFileRoute("/ajuda")({
  component: AjudaPage,
  head: () => ({
    meta: [
      { title: "Central de Ajuda | FriggaFrio" },
      {
        name: "description",
        content: "Dúvidas frequentes, suporte e atendimento FriggaFrio.",
      },
    ],
  }),
})
