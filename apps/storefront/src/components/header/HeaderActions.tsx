import { Link, useParams } from "@tanstack/react-router"
import { ShoppingCart, User } from "lucide-react"
import { useAuth } from "@/lib/hooks/use-auth"
import { useCart } from "@/lib/hooks/use-cart"
import { useCartDrawer } from "@/lib/context/cart"
import { getCartItemCount } from "@/lib/utils/cart"

export function HeaderActions({ compact: _compact = false }: { compact?: boolean }) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const { isAuthenticated } = useAuth()
  const { data: cart } = useCart()
  const { openCart } = useCartDrawer()
  const cartItemCount = getCartItemCount(cart?.items)

  return (
    <div className="flex items-center gap-1 md:gap-2">
      <Link
        to={isAuthenticated ? ("/$countryCode/account" as string) : ("/$countryCode/account/login" as string)}
        params={{ countryCode }}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        aria-label={isAuthenticated ? "Minha conta" : "Entrar na conta"}
        title={isAuthenticated ? "Minha conta" : "Entrar"}
      >
        <User className="h-5 w-5" aria-hidden="true" />
      </Link>

      <button
        type="button"
        onClick={openCart}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        aria-label={`Abrir carrinho com ${cartItemCount} ${cartItemCount === 1 ? "item" : "itens"}`}
        title="Carrinho"
      >
        <span className="relative inline-flex">
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          {cartItemCount > 0 && (
            <span
              className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--color-accent)] px-1 text-[10px] font-bold leading-none text-[var(--color-navy)]"
              aria-hidden="true"
            >
              {cartItemCount > 99 ? "99+" : cartItemCount}
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
