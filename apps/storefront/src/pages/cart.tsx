import {
  CartLineItem,
  CartSummary,
  CartEmpty,
  CartPromo,
} from "@/components/cart"
import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { CheckoutStepKey } from "@/lib/types/global"
import { useCart, useCreateCart } from "@/lib/hooks/use-cart"
import { useCreateQuoteFromCart } from "@/lib/hooks/use-quotes"
import { useAuth } from "@/lib/hooks/use-auth"
import { getCartItemCount, getStoredCart, isCartCheckoutReady, sortCartItems, getCartLineCommercialState } from "@/lib/utils/cart"
import { DocumentText } from "@medusajs/icons"
import { Link, useLoaderData, useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"

const DEFAULT_CART_FIELDS =
  "id,*items,items.variant.id,items.variant.title,items.variant.thumbnail,items.variant.inventory_quantity,items.variant.manage_inventory,items.variant.allow_backorder,items.variant.product.id,items.variant.product.title,items.variant.product.thumbnail,total,+currency_code,subtotal,item_subtotal,shipping_total,discount_total,tax_total,*promotions"

const Cart = () => {
  const { region, countryCode } = useLoaderData({
    from: "/$countryCode/cart",
  })
  const { data: cart, isLoading: cartLoading } = useCart({
    fields: DEFAULT_CART_FIELDS,
  })
  const createCartMutation = useCreateCart()
  const createQuoteFromCartMutation = useCreateQuoteFromCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const createAttemptedRef = useRef(false)

  // Recover a missing/stale cart once. Keeping this side effect out of render
  // avoids duplicate cart creation when React re-renders during the mutation.
  useEffect(() => {
    if (cart || cartLoading || createCartMutation.isPending || createAttemptedRef.current) {
      return
    }

    createAttemptedRef.current = true
    createCartMutation.mutate(
      { region_id: region.id },
      {
        onError: () => {
          createAttemptedRef.current = false
        },
      }
    )
  }, [cart, cartLoading, createCartMutation, region.id])

  const cartItems = sortCartItems(cart?.items || [])
  const itemCount = getCartItemCount(cartItems)
  const checkoutReady = isCartCheckoutReady(cartItems)
  const hasQuoteOnlyItems = cartItems.some((item) => getCartLineCommercialState(item) === "quote_only")

  const handleRequestQuote = () => {
    if (!isAuthenticated) {
      toast.error("Entre na sua conta para solicitar um orçamento")
      navigate({ to: `/${countryCode}/account/login` })
      return
    }
    
    const cartId = getStoredCart()
    if (!cartId) {
      toast.error("Nenhum carrinho encontrado")
      return
    }

    createQuoteFromCartMutation.mutate(
      { cart_id: cartId },
      {
        onSuccess: () => {
          toast.success("Solicitação de orçamento enviada!")
          navigate({ to: `/${countryCode}/quotes` })
        },
        onError: (error: Error) => {
          toast.error(error.message || "Não foi possível criar o orçamento")
        },
      }
    )
  }

  return (
    <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {cartLoading ? (
        <Loading />
      ) : cartItems.length === 0 ? (
        <CartEmpty />
      ) : (
        <div className="space-y-5">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary">Seu carrinho</h1>
              <p className="text-sm text-text-secondary mt-0.5">
                {itemCount} {itemCount === 1 ? "produto no seu pedido" : "produtos no seu pedido"}
              </p>
            </div>
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              className="text-sm font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-hover)] transition-colors flex items-center gap-1"
            >
              ← Continuar comprando
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Cart Items */}
            <div className="flex-1 min-w-0 bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
              <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
                <h2 className="text-sm font-semibold text-text-primary">
                  Produtos no carrinho
                </h2>
                <span className="text-xs text-text-muted">{itemCount} {itemCount === 1 ? "item" : "itens"}</span>
              </div>
              <div className="divide-y divide-[#F1F5F9]">
                {cartItems.map((item) => (
                  <CartLineItem
                    key={item.id}
                    item={item}
                    cart={cart!}
                    fields={DEFAULT_CART_FIELDS}
                  />
                ))}
              </div>
            </div>

            {/* Unified Summary Sidebar */}
            {cart && (
              <div className="w-full lg:w-[380px] lg:sticky lg:top-24 flex-shrink-0">
                <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
                  {/* Summary Header */}
                  <div className="px-5 py-3 border-b border-[#E2E8F0]">
                    <h2 className="text-sm font-semibold text-text-primary">
                      Resumo do pedido
                    </h2>
                  </div>

                  {/* Summary Lines */}
                  <div className="px-5 py-4">
                    <CartSummary cart={cart} context="page" />
                  </div>

                  {/* Checkout CTA */}
                  <div className="px-5 pb-4 space-y-2">
                    <Link to="/$countryCode/checkout" params={{ countryCode }} search={{ step: CheckoutStepKey.ADDRESSES }} className="block" onClick={(event) => { if (!checkoutReady) event.preventDefault() }}>
                      <Button className="w-full text-white font-bold" size="lg" disabled={!checkoutReady}>
                        Ir para o checkout
                      </Button>
                    </Link>

                    {hasQuoteOnlyItems && (
                      <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2"
                        size="lg"
                        onClick={handleRequestQuote}
                        disabled={createQuoteFromCartMutation.isPending}
                      >
                        <DocumentText className="w-5 h-5" />
                        {createQuoteFromCartMutation.isPending ? "Enviando..." : "Solicitar orçamento"}
                      </Button>
                    )}
                  </div>

                  {/* Trust indicators */}
                  <div className="px-5 pb-3 flex items-center gap-4 text-xs text-text-muted">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                      Checkout seguro
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                      Opções de entrega no checkout
                    </span>
                  </div>

                  {/* Coupon — compact, inside the card */}
                  <div className="px-5 py-3 border-t border-[#F1F5F9]">
                    <CartPromo cart={cart} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Cart
