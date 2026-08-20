import { createFileRoute } from "@tanstack/react-router"
import ForgotPasswordPage from "@/pages/forgot-password"

export const Route = createFileRoute("/$countryCode/account/forgot-password")({
  component: ForgotPasswordPage,
})
