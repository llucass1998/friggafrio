import { createFileRoute } from "@tanstack/react-router"
import NewsletterActionPage from "@/pages/newsletter-action"

export const Route = createFileRoute("/$countryCode/newsletter/confirm")({
  component: () => <NewsletterActionPage action="confirm" />,
})
