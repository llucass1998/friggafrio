import { createFileRoute } from "@tanstack/react-router"
import TrocasPage from "@/pages/support/trocas"

export const Route = createFileRoute("/trocas")({
  component: TrocasPage,
  head: () => ({
    meta: [
      { title: "Política de Trocas | FriggaFrio" },
      {
        name: "description",
        content: "Política de Devoluções e Garantia FriggaFrio.",
      },
    ],
  }),
})
