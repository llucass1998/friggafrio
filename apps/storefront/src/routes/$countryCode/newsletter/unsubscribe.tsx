import { createFileRoute } from "@tanstack/react-router"
import NewsletterActionPage from "@/pages/newsletter-action"

export const Route = createFileRoute("/$countryCode/newsletter/unsubscribe")({
  component: () => <NewsletterActionPage action="unsubscribe" />,
})
