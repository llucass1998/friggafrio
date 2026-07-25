import { Link, useParams } from "@tanstack/react-router"
import { User, ShoppingCart, FileText } from "lucide-react"

export function HeaderActions({ compact = false }: { compact?: boolean }) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  // Placeholder para as quantidades, num app real conectamos via useAuth/useCart
  const cartItemCount = 0
  const quoteItemCount = 0
  const isAuthenticated = false
  const customerName = ""

  return (
    <div className="flex items-center gap-4 md:gap-6">
      {/* Account */}
      <Link
        to={isAuthenticated ? ("/$countryCode/account" as string) : ("/$countryCode" as string)}
        params={{ countryCode }}
        className="flex items-center gap-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label="Minha conta"
      >
        <User className="w-5 h-5 shrink-0 text-[var(--color-navy)]" />
        {!compact && (
          <span className="font-medium whitespace-nowrap hidden lg:block">
            {isAuthenticated ? \`Olá, \${customerName}\` : "Entrar"}
          </span>
        )}
      </Link>

      {/* Quote / Orçamentos */}
      <Link
        to={"/$countryCode" as string}
        params={{ countryCode }}
        className="flex items-center gap-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors relative focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label={\`Orçamentos com \${quoteItemCount} itens\`}
      >
        <div className="relative">
          <FileText className="w-5 h-5 shrink-0 text-[var(--color-navy)]" />
          {quoteItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[var(--color-surface-soft)] text-[var(--color-navy)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {quoteItemCount}
            </span>
          )}
        </div>
        {!compact && <span className="font-medium whitespace-nowrap hidden xl:block">Orçamento</span>}
      </Link>

      {/* Cart */}
      <Link
        to={"/$countryCode" as string}
        params={{ countryCode }}
        className="flex items-center gap-2 text-[var(--color-navy)] hover:text-[var(--color-primary)] transition-colors relative focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label={\`Carrinho com \${cartItemCount} itens\`}
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6 shrink-0" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[var(--color-accent)] text-[var(--color-navy)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartItemCount}
            </span>
          )}
        </div>
        {!compact && <span className="hidden lg:block font-medium text-sm whitespace-nowrap">R$ 0,00</span>}
      </Link>
    </div>
  )
}
