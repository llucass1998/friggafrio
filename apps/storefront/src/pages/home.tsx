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
      {!authLoading && isAuthenticated && (
        <div className="bg-[var(--color-navy)] text-white px-4 py-2 text-sm flex justify-center items-center gap-4">
          <span>Você está logado.</span>
          <Link to={"/$countryCode/account" as string} params={{ countryCode }} className="font-bold underline hover:text-[var(--color-accent)]">
            Minha Conta
          </Link>
        </div>
      )}
      <PublicHomePage />
    </>
  )
}
