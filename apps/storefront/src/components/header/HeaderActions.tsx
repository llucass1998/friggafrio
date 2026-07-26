import { Link, useParams } from "@tanstack/react-router"
import { User, ShoppingCart } from "lucide-react"
import { useAuth } from "../../lib/context/auth-context"
import { useCart } from "../../lib/hooks/use-cart"
import { formatPrice } from "../../lib/utils/price"
import { useCartDrawer } from "../../lib/context/cart"

export function HeaderActions({ compact = false }: { compact?: boolean }) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const { isAuthenticated, customer } = useAuth()
  const { data: cart, isLoading: isCartLoading } = useCart()
  const { openCart } = useCartDrawer()

  const cartItemCount = cart?.items?.reduce((total, item) => total + Number(item.quantity ?? 0), 0) ?? 0

  // Exibir subtotal ao invés do total para ignorar taxas de frete no header.
  // Usa o fallback para "BRL" e garante "pt-BR".
  const cartTotal = formatPrice({
    amount: cart?.item_subtotal || cart?.subtotal || 0,
    currency_code: cart?.region?.currency_code || cart?.currency_code || "BRL",
    locale: "pt-BR"
  })

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
        <User className="w-5 h-5 shrink-0 text-[var(--color-navy)]" aria-hidden="true" />
        {!compact && (
          <span className="font-medium whitespace-nowrap hidden lg:block">
            {isAuthenticated ? `Olá, ${customerName}` : "Entrar"}
          </span>
        )}
      </Link>

      {/* Cart */}
      <button
        type="button"
        onClick={openCart}
        className="flex items-center gap-2 text-[var(--color-navy)] hover:text-[var(--color-primary)] transition-colors relative focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md p-1"
        aria-label={`Abrir carrinho com ${cartItemCount} ${cartItemCount === 1 ? "item" : "itens"}`}
      >
        <div className="relative">
          <ShoppingCart className="w-6 h-6 shrink-0" aria-hidden="true" />
          {cartItemCount > 0 && (
            <span
              className="absolute -top-2 -right-2 bg-[var(--color-accent)] text-[var(--color-navy)] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white pointer-events-none"
              aria-hidden="true"
            >
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </div>
        {!compact && (
          <span className="hidden lg:block font-medium text-sm whitespace-nowrap">
            {isCartLoading ? "Carregando..." : (cartItemCount > 0 ? cartTotal : "Carrinho")}
          </span>
        )}
      </button>
    </div>
  )
}
