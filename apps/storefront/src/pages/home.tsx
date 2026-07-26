import { useAuth } from "@/lib/hooks/use-auth"
import { PublicHomePage } from "@/pages/public-home"
import {  useParams } from "@tanstack/react-router"

export default function Home() {
  const { isAuthenticated: _isAuthenticated, isLoading: _authLoading } = useAuth()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const _countryCode = params.countryCode || "br"

  // Sempre mostramos a Home pública para quem acessa a raiz.
  return (
    <>
      <PublicHomePage />
    </>
  )
}
