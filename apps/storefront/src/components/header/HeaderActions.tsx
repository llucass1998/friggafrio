import { Link, useParams } from "@tanstack/react-router"
import { User, ShoppingCart, FileText } from "lucide-react"
import { useAuth } from "../../lib/context/auth-context"
import { useCart } from "../../lib/hooks/use-cart"
import { formatPrice } from "../../lib/utils/price"

import { useCartDrawer } from "../../lib/context/cart"

export function HeaderActions({ compact = false }: { compact?: boolean }) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const { isAuthenticated, customer } = useAuth()
  const { data: cart, isLoading: isCartLoading } = useCart()
  const { openCart } = useCartDrawer()

  const cartItemCount = cart?.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
  const cartTotal = formatPrice({ amount: cart?.total || 0, currency_code: cart?.currency_code || "BRL", locale: "pt-BR" })

  // Orçamentos (Em um setup real isso seria fetchado dos quotes)
  const quoteItemCount = 0

  const customerName = customer?.first_name || customer?.email?.split('@')[0] || ""

  return (
    <div className="flex items-center gap-4 md:gap-6">
      {/* Account */}
      <Link
        to={isAuthenticated ? ("/$countryCode/account" as string) : ("/$countryCode/account/login" as string)}
        params={{ countryCode }}
        className="flex items-center gap-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label="Minha conta"
      >
        <User className="w-5 h-5 shrink-0 text-[var(--color-navy)]" />
        {!compact && (
          <span className="font-medium whitespace-nowrap hidden lg:block">
            {isAuthenticated ? `Olá, ${customerName}` : "Entrar"}
          </span>
        )}
      </Link>

      {/* Quote / Orçamentos */}
      <Link
        to={"/$countryCode" as string}
        params={{ countryCode }}
        className="flex items-center gap-2 text-sm text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors relative focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label={`Orçamentos com ${quoteItemCount} itens`}
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
      <button
        onClick={openCart}
        className="flex items-center gap-2 text-[var(--color-navy)] hover:text-[var(--color-primary)] transition-colors relative focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label={`Carrinho com ${cartItemCount} itens`}
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6 shrink-0" />
          {cartItemCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-[var(--color-accent)] text-[var(--color-navy)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
              {cartItemCount}
            </span>
          )}
        </div>
        {!compact && (
          <span className="hidden lg:block font-medium text-sm whitespace-nowrap">
            {isCartLoading ? "Carregando..." : cartTotal}
          </span>
        )}
      </button>
    </div>
  )
}
