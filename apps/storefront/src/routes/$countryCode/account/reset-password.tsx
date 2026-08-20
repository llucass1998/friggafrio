import { createFileRoute } from "@tanstack/react-router"
import ResetPasswordPage from "@/pages/reset-password"

export const Route = createFileRoute("/$countryCode/account/reset-password")({
  component: ResetPasswordPage,
})
