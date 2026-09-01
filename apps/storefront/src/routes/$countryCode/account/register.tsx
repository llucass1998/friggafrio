import { createFileRoute } from "@tanstack/react-router"
import RegisterPage from "@/pages/register"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/account/register")({
  head: ({ params }) => pageMeta({
    title: "Criar conta | FriggaFrio",
    description: "Crie sua conta FriggaFrio para acompanhar pedidos e favoritos.",
    path: `/${params.countryCode}/account/register`,
    indexable: false,
  }),
  component: RegisterPage,
})
