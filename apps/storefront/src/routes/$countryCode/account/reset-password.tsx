import { createFileRoute } from "@tanstack/react-router"
import ResetPasswordPage from "@/pages/reset-password"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/account/reset-password")({
  head: ({ params }) => pageMeta({
    title: "Definir nova senha | FriggaFrio",
    description: "Defina uma nova senha para acessar sua conta FriggaFrio.",
    path: `/${params.countryCode}/account/reset-password`,
    indexable: false,
  }),
  component: ResetPasswordPage,
})
