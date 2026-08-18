import React, { useState, useEffect } from "react"
import { ShoppingCart } from "lucide-react"
import { useCartDrawer } from "@/lib/context/cart"
import { useCart } from "@/lib/hooks/use-cart"
import { getCartItemCount } from "@/lib/utils/cart"
import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"

export function FloatingActions() {
  const [showScroll, setShowScroll] = useState(false)
  const { isOpen, openCart } = useCartDrawer()
  const { data: cart } = useCart({ fields: DEFAULT_CART_DROPDOWN_FIELDS })
  const itemCount = getCartItemCount(cart?.items)

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 500) {
        setShowScroll(true)
      } else if (showScroll && window.scrollY <= 500) {
        setShowScroll(false)
      }
    }

    window.addEventListener("scroll", checkScrollTop)
    return () => window.removeEventListener("scroll", checkScrollTop)
  }, [showScroll])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // The drawer owns the cart interaction. Hide these shortcuts while it is
  // open so they cannot sit above the drawer or compete with its close action.
  if (isOpen) return null

  return (
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex flex-col gap-[10px] safe-area-bottom md:bottom-6 md:right-6 md:gap-3">
      {/* Floating Cart */}
      {itemCount > 0 && (
        <button
          type="button"
          onClick={openCart}
          className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full border border-transparent bg-[var(--color-primary)] text-white shadow-md transition-[background-color,border-color,box-shadow,transform] duration-[var(--motion-duration-interaction)] hover:border-white/20 hover:bg-[var(--color-primary-hover)] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] md:h-14 md:w-14"
          aria-label={`Abrir carrinho com ${itemCount} ${itemCount === 1 ? "item" : "itens"}`}
          title="Abrir carrinho"
        >
          <ShoppingCart className="h-6 w-6" aria-hidden="true" />
          <span
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[var(--color-accent)] px-1 text-[11px] font-bold leading-none text-[var(--color-navy)] md:-right-2 md:-top-2 md:h-6 md:min-w-6 md:text-xs"
            aria-hidden="true"
          >
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        </button>
      )}

      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`flex h-[52px] w-[52px] items-center justify-center rounded-full bg-white text-[var(--color-navy)] shadow-md transition-[opacity,transform,box-shadow] duration-[var(--motion-duration-medium)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] hover:shadow-lg md:h-14 md:w-14 ${showScroll ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>

    </div>
  )
}
