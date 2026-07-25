import React, { useState, useEffect } from 'react';
import { useCartDrawer } from "@/lib/context/cart";
import { useCart } from "@/lib/hooks/use-cart";
import { ShoppingCart } from "lucide-react";
import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart";

export function FloatingActions() {
  const [showScroll, setShowScroll] = useState(false);

  // Cart logic
  const { openCart } = useCartDrawer();
  const { data: cart } = useCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  });

  const itemCount = getCartItemCount(cart?.items);
  const showCart = itemCount > 0;
  const displayCount = itemCount > 99 ? "99+" : itemCount;

  useEffect(() => {
    const checkScrollTop = () => {
      if (!showScroll && window.scrollY > 500) {
        setShowScroll(true);
      } else if (showScroll && window.scrollY <= 500) {
        setShowScroll(false);
      }
    };

    window.addEventListener('scroll', checkScrollTop);
    return () => window.removeEventListener('scroll', checkScrollTop);
  }, [showScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col gap-[10px] md:gap-3 z-40 safe-area-bottom">
      {/* Scroll to Top */}
      <button
        onClick={scrollToTop}
        className={`bg-white text-[var(--color-navy)] shadow-md hover:shadow-lg rounded-full w-[52px] h-[52px] md:w-14 md:h-14 flex items-center justify-center transition-all duration-300 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
        aria-label="Voltar ao topo"
        title="Voltar ao topo"
      >
        <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m18 15-6-6-6 6"/>
        </svg>
      </button>

      {/* Floating Cart */}
      {showCart && (
        <button
          type="button"
          onClick={openCart}
          className="relative bg-[var(--color-primary)] text-white shadow-md hover:shadow-lg rounded-full w-[52px] h-[52px] md:w-14 md:h-14 flex items-center justify-center transition-all duration-200 hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] border border-transparent hover:border-white/20"
          aria-label={`Abrir carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
          title="Abrir carrinho"
        >
          <ShoppingCart size={24} aria-hidden="true" />

          <span
            className="absolute -top-1 -right-1 md:-top-2 md:-right-2 bg-[var(--color-accent)] text-[var(--color-navy)] text-[11px] md:text-xs font-bold w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border-2 border-white pointer-events-none"
            aria-hidden="true"
          >
            {displayCount}
          </span>
        </button>
      )}
    </div>
  );
}
