import { createFileRoute } from "@tanstack/react-router"
import ForgotPasswordPage from "@/pages/forgot-password"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/account/forgot-password")({
  head: ({ params }) => pageMeta({
    title: "Recuperar senha | FriggaFrio",
    description: "Solicite a recuperação segura da sua senha FriggaFrio.",
    path: `/${params.countryCode}/account/forgot-password`,
    indexable: false,
  }),
  component: ForgotPasswordPage,
})
