import { useState } from "react"
import { useNavigate, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ShoppingCart, Loader2, Check } from "lucide-react"
import { useCart, useAddToCart } from "@/lib/hooks/use-cart"
import { useCartDrawer } from "@/lib/context/cart"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"

interface QuickCartButtonProps {
  product: HttpTypes.StoreProduct
  className?: string
}

export function QuickCartButton({ product, className = "" }: QuickCartButtonProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const navigate = useNavigate()
  const { openCart } = useCartDrawer()
  const { data: cart } = useCart({ fields: DEFAULT_CART_DROPDOWN_FIELDS })
  const addToCartMutation = useAddToCart({ fields: DEFAULT_CART_DROPDOWN_FIELDS })
  const [isAdding, setIsAdding] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const purchaseState = getProductPurchaseState(product)
  const isPurchasable = purchaseState.status === "purchasable"
  const variants = product.variants || []
  const hasMultipleVariants = variants.length > 1 || (product.options?.length ?? 0) > 1

  const isOutOfStock = purchaseState.status === "out_of_stock" || purchaseState.status === "unavailable"
  const isDisabled = !isPurchasable && !hasMultipleVariants

  // Check if this product is already present in the active cart
  const isInCart = Boolean(
    cart?.items?.some((item) => {
      if (item.variant?.product_id && item.variant.product_id === product.id) return true
      if (item.variant?.product?.id && item.variant.product?.id === product.id) return true
      if (item.variant_id && variants.some((v) => v.id === item.variant_id)) return true
      if ((item as unknown as Record<string, unknown>).product_id === product.id) return true
      return false
    })
  )

  const isGreen = isInCart || isAnimating

  const ariaLabel = isOutOfStock
    ? "Produto indisponível"
    : hasMultipleVariants
    ? "Ver opções do produto"
    : isInCart
    ? "Produto no carrinho. Clique para ver o carrinho"
    : "Adicionar ao carrinho"

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isDisabled || isAdding) return

    // If already in cart, clicking opens the cart drawer
    if (isInCart) {
      openCart()
      return
    }

    // If the product has multiple commercial variants (options/choices),
    // redirect directly to the PDP so the user can choose the right option.
    if (hasMultipleVariants) {
      void navigate({
        to: "/$countryCode/products/$handle" as string,
        params: { countryCode, handle: product.handle },
      })
      return
    }

    // Single default variant: add directly to Medusa cart
    const variantId = variants[0]?.id
    if (!variantId) return

    setIsAdding(true)
    setIsAnimating(true)
    try {
      await addToCartMutation.mutateAsync({
        variant_id: variantId,
        quantity: 1,
        country_code: countryCode,
        product,
        variant: variants[0],
      })
      setTimeout(() => {
        openCart()
      }, 1000)
    } catch {
      setIsAnimating(false)
    } finally {
      setIsAdding(false)
      setTimeout(() => {
        setIsAnimating(false)
      }, 650)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled || isAdding}
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-md bg-transparent border-0 shadow-none transition-all duration-300 ${
        isGreen
          ? "text-emerald-600 hover:text-emerald-700 hover:scale-105"
          : "text-[var(--color-navy)] hover:text-[var(--color-primary)] hover:scale-105"
      } focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:text-slate-300 disabled:opacity-50 ${className}`}
    >
      {isGreen ? (
        <div className={`relative inline-flex items-center justify-center text-emerald-600 ${isAnimating ? "animate-cart-pull-return" : ""}`} aria-hidden="true">
          <ShoppingCart className="h-5 w-5 fill-emerald-600 text-emerald-600" strokeWidth={2} />
          <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm ring-1 ring-white">
            <Check className="h-2.5 w-2.5 stroke-[3.5]" />
          </span>
        </div>
      ) : isAdding ? (
        <div className="relative inline-flex items-center justify-center text-[var(--color-primary)] animate-pulse" aria-hidden="true">
          <ShoppingCart className="h-5 w-5 scale-75 opacity-60 transition-transform duration-200" />
          <Loader2 className="absolute -top-1 -right-1 h-3 w-3 animate-spin text-[var(--color-primary)]" />
        </div>
      ) : (
        <div className="relative inline-flex items-center justify-center" aria-hidden="true">
          <ShoppingCart className="h-5 w-5 transition-transform duration-200" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-[8px] font-bold ring-1 ring-slate-300">
            +
          </span>
        </div>
      )}
    </button>
  )
}

export default QuickCartButton
