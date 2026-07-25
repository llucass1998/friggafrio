import { useAuth } from "@/lib/hooks/use-auth"
import { PublicHomePage } from "./public-home"
import { Link, useParams } from "@tanstack/react-router"
import { DashboardPageLayout } from "@/components/dashboard-page-layout"

// Exportaremos a página pública por padrão.
// A antiga funcionalidade de dashboard do B2B vai ser mantida,
// mas apenas será acessada por outra rota (ex: /account ou /dashboard).
// Para o escopo deste projeto Frigga, a Home DEVE ser a página pública.
export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  // Sempre mostramos a Home pública para quem acessa a raiz.
  // Se o usuário está autenticado, podemos mostrar um banner ou atalho para o painel B2B.
  return (
    <>
      {!authLoading && isAuthenticated && (
        <div className="bg-[var(--color-navy)] text-white px-4 py-2 text-sm flex justify-center items-center gap-4">
          <span>Você está logado.</span>
          <Link to={"/$countryCode/account" as string} params={{ countryCode }} className="font-bold underline hover:text-[var(--color-accent)]">
            Acessar Painel B2B
          </Link>
        </div>
      )}
      <PublicHomePage />
    </>
  )
}
