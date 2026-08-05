import { useAuth } from "@/lib/hooks/use-auth"
import { PublicHomePage } from "./public-home"
import { Link, useParams } from "@tanstack/react-router"

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  // Sempre mostramos a Home pública para quem acessa a raiz.
  return (
    <>
      <PublicHomePage />
    </>
  )
}
