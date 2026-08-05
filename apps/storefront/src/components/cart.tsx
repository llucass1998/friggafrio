import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerFooter,
} from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Loading } from "@/components/ui/loading"
import { Price } from "@/components/ui/price"
import { Thumbnail } from "@/components/ui/thumbnail"
import {
  useCart,
  useDeleteLineItem,
  useUpdateLineItem,
  useApplyPromoCode,
  useRemovePromoCode,
} from "@/lib/hooks/use-cart"
import { sortCartItems, getCartItemCount } from "@/lib/utils/cart"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { getPricePercentageDiff } from "@/lib/utils/price"
import { useCartDrawer } from "@/lib/context/cart"
import { Minus, Plus, Trash, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Link, useLocation } from "@tanstack/react-router"
import { ShoppingCart } from "lucide-react"
import { clsx } from "clsx"
import { useState } from "react"


type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  className?: string
}

export const LineItemPrice = ({ item, currencyCode, className }: LineItemPriceProps) => {
  const originalPrice = item.original_total
  const currentPrice = item.total
  const hasReducedPrice = currentPrice !== null && currentPrice !== undefined && originalPrice !== null && originalPrice !== undefined && currentPrice < originalPrice

  return (
    <Price
      price={currentPrice ?? 0}
      currencyCode={currencyCode}
      originalPrice={
        hasReducedPrice
          ? {
              price: originalPrice ?? 0,
              percentage: getPricePercentageDiff(originalPrice ?? 0, currentPrice ?? 0),
            }
          : undefined
      }
      className={className}
    />
  )
}


type CartDeleteItemProps = {
  item: HttpTypes.StoreCartLineItem
  fields?: string
}

export const CartDeleteItem = ({ item, fields }: CartDeleteItemProps) => {
  const deleteLineItemMutation = useDeleteLineItem({ fields })
  return (
    <button
      onClick={() => deleteLineItemMutation.mutate({ line_id: item.id })}
      disabled={deleteLineItemMutation.isPending}
      className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
    >
      <Trash className="w-4 h-4" />
    </button>
  )
}


type CartItemQuantitySelectorProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "default" | "compact"
  fields?: string
}

export const CartItemQuantitySelector = ({
  item,
  type = "default",
  fields,
}: CartItemQuantitySelectorProps) => {
  const updateLineItemMutation = useUpdateLineItem({ fields })
  const deleteLineItemMutation = useDeleteLineItem({ fields })
  const isPending = updateLineItemMutation.isPending || deleteLineItemMutation.isPending

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity === 0) {
      deleteLineItemMutation.mutate({ line_id: item.id })
    } else {
      updateLineItemMutation.mutate({
        line_id: item.id,
        quantity: newQuantity,
      })
    }
  }

  return (
    <div className="flex items-center">
      <button
        onClick={() => handleQuantityChange(item.quantity - 1)}
        disabled={isPending}
        className={clsx(
          "flex items-center justify-center transition-colors disabled:opacity-50",
          type === "compact"
            ? "w-7 h-7 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            : "w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className={clsx(
          "font-medium text-text-primary text-center",
          type === "compact"
            ? "text-sm min-w-[2rem]"
            : "text-base min-w-[2.5rem]"
        )}
      >
        {item.quantity}
      </span>
      <button
        onClick={() => handleQuantityChange(item.quantity + 1)}
        disabled={isPending}
        className={clsx(
          "flex items-center justify-center transition-colors disabled:opacity-50",
          type === "compact"
            ? "w-7 h-7 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            : "w-9 h-9 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}


interface CartLineItemProps {
  item: HttpTypes.StoreCartLineItem
  cart: HttpTypes.StoreCart
  type?: "default" | "compact" | "display"
  fields?: string
  className?: string
}

const CompactCartLineItem = ({ item, cart, fields }: CartLineItemProps) => {
  return (
    <div className="flex items-start gap-x-4" data-testid="cart-item">
      <Thumbnail thumbnail={item.thumbnail} alt={item.product_title || item.title} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="text-base font-medium line-clamp-1 text-zinc-900">
              {item.product_title}
            </h4>
            <div className="text-sm text-zinc-600">
              {item.variant_title && item.variant_title !== "Default Variant" && (
                <span>{item.variant_title}</span>
              )}
            </div>
          </div>
          <CartDeleteItem item={item} fields={fields} />
        </div>

        <div className="flex items-center justify-between mt-2">
          <CartItemQuantitySelector item={item} fields={fields} />
          <Price price={item.total ?? 0} currencyCode={cart.currency_code} textSize="small" />
        </div>
      </div>
    </div>
  )
}

const DisplayCartLineItem = ({ item, cart, className }: CartLineItemProps) => {
  return (
    <div
      className={clsx(
        "flex items-center gap-4 py-3 border-b border-zinc-300 last:border-b-0",
        className
      )}
    >
      <Thumbnail
        thumbnail={item.thumbnail}
        alt={item.product_title || item.title}
        className="w-16 h-16"
      />
      <div className="flex-1">
        <p className="text-base font-semibold text-zinc-900">{item.product_title}</p>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <p className="text-sm text-zinc-600">{item.variant_title}</p>
        )}
        <p className="text-sm text-zinc-600">Quantity: {item.quantity}</p>
      </div>
      <div className="text-right">
        <Price price={item.total ?? 0} currencyCode={cart.currency_code} textWeight="plus" />
      </div>
    </div>
  )
}

export const CartLineItem = ({
  item,
  cart,
  type = "default",
  fields,
  className,
}: CartLineItemProps) => {
  if (type === "compact") {
    return <CompactCartLineItem item={item} cart={cart} fields={fields} className={className} />
  }

  if (type === "display") {
    return <DisplayCartLineItem item={item} cart={cart} className={className} />
  }

  return (
    <div className={clsx("flex items-center gap-6 p-6 hover:bg-surface-hover/30 transition-colors", className)}>
      <div className="flex-shrink-0">
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-slate-50 border border-border">
          <Thumbnail 
            thumbnail={item.thumbnail} 
            alt={item.product_title || item.title} 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text-primary line-clamp-1">
              {item.product_title}
            </h3>
            {item.variant_title && item.variant_title !== "Default Variant" && (
              <p className="text-sm text-text-secondary mt-1">{item.variant_title}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <CartItemQuantitySelector item={item} fields={fields} />
              </div>
              <CartDeleteItem item={item} fields={fields} />
            </div>
          </div>

          <div className="text-right sm:min-w-[100px]">
            <LineItemPrice item={item} currencyCode={cart.currency_code} className="text-lg font-semibold" />
            {item.quantity > 1 && (
              <p className="text-xs text-text-muted mt-1">
                <Price price={(item.total ?? 0) / item.quantity} currencyCode={cart.currency_code} /> each
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


interface CartSummaryProps {
  cart: HttpTypes.StoreCart
}

export const CartSummary = ({ cart }: CartSummaryProps) => {
  if ("isOptimistic" in cart && cart.isOptimistic) {
    return <Loading />
  }
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <Price
            price={cart.item_subtotal ?? 0}
            currencyCode={cart.currency_code}
            className="text-text-primary font-medium"
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Shipping</span>
          {cart.shipping_total !== null && cart.shipping_total !== undefined ? (
            <Price
              price={cart.shipping_total}
              currencyCode={cart.currency_code}
              className="text-text-primary font-medium"
            />
          ) : (
            <span className="text-text-muted text-sm">-</span>
          )}
        </div>

        {cart.discount_total !== null && cart.discount_total !== undefined && cart.discount_total > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Discount</span>
            <Price
              price={cart.discount_total}
              currencyCode={cart.currency_code}
              type="discount"
              className="text-emerald-600 font-medium"
            />
          </div>
        ) : null}

        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Tax</span>
          {cart.tax_total !== null && cart.tax_total !== undefined ? (
            <Price
              price={cart.tax_total}
              currencyCode={cart.currency_code}
              className="text-text-primary font-medium"
            />
          ) : (
            <span className="text-text-muted text-sm">-</span>
          )}
        </div>
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-text-primary">Total</span>
          <Price
            price={cart.total ?? 0}
            currencyCode={cart.currency_code}
            className="text-xl font-bold text-text-primary"
          />
        </div>
      </div>
    </div>
  )
}


type CartPromoProps = {
  cart: HttpTypes.StoreCart
}

export const CartPromo = ({ cart }: CartPromoProps) => {
  const [showInput, setShowInput] = useState(false)
  const [promoCode, setPromoCode] = useState("")
  const applyPromoCodeMutation = useApplyPromoCode()
  const removePromoCodeMutation = useRemovePromoCode()

  const handleRemove = (code: string) => {
    removePromoCodeMutation.mutate({ code })
  }

  const handleApply = () => {
    applyPromoCodeMutation.mutate(
      { code: promoCode },
      {
        onSuccess: () => {
          setShowInput(false)
          setPromoCode("")
        },
      }
    )
  }

  return (
    <div className="space-y-3">
      {cart.promotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {cart.promotions.map((promotion) => (
            <div 
              key={promotion.code} 
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
            >
              <span>{promotion.code}</span>
              <button
                onClick={() => handleRemove(promotion.code || "")}
                className="hover:text-emerald-900 transition-colors"
              >
                <XMark className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!showInput ? (
        <button
          onClick={() => setShowInput(true)}
          className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
        >
          + Add promo code
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Enter code"
              name="promoCode"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={handleApply} 
              variant="primary" 
              size="sm"
              disabled={!promoCode.trim()}
            >
              Apply
            </Button>
          </div>
          <button 
            onClick={() => {
              setShowInput(false)
              setPromoCode("")
            }} 
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}


export const CartEmpty = () => {
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "br"

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 motion-dropdown animate-in slide-in-from-bottom-2 fade-in-0">
      <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface-soft)] border border-[#E5EDF4] flex items-center justify-center mb-6">
        <ShoppingCart className="w-10 h-10 text-[#8EA6BC] opacity-60" />
      </div>
      <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-2">Seu carrinho está vazio</h2>
      <p className="text-[var(--color-text-muted)] text-center max-w-md mb-8">
        Encontre produtos para refrigeração e climatização e adicione os itens que deseja consultar ou comprar.
      </p>
      <Link to="/$countryCode/store" params={{ countryCode }}>
        <Button variant="primary" size="lg">
          Explorar produtos
        </Button>
      </Link>
    </div>
  )
}


export const DEFAULT_CART_DROPDOWN_FIELDS = "id, *items, total, currency_code, item_subtotal"

export const CartDropdown = () => {
  const { isOpen, openCart, closeCart } = useCartDrawer()
  const { data: cart } = useCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "br"

  const sortedItems = sortCartItems(cart?.items || [])
  const itemCount = getCartItemCount(sortedItems)

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <DrawerContent
        className="flex flex-col z-[100] h-full sm:max-w-md w-full right-0 left-auto border-l border-[#E5EDF4]"
        style={{ right: 0, left: 'auto', bottom: 0 }}
        aria-describedby="cart-drawer-description"
      >
        <DrawerHeader className="border-b border-[#E5EDF4]">
          <DrawerTitle className="text-xl font-bold text-[var(--color-navy)]">Seu Carrinho</DrawerTitle>
          <div id="cart-drawer-description" className="sr-only">Lista de itens adicionados ao carrinho.</div>
        </DrawerHeader>

        {/* Empty Cart */}
        {(!cart || itemCount === 0) && (
          <div className="flex flex-col items-center justify-center flex-1 p-6 motion-dropdown animate-in fade-in-0 duration-[var(--motion-duration-medium)]">
            <div className="w-20 h-20 rounded-2xl bg-[#F5F8FA] border border-[#E5EDF4] flex items-center justify-center mb-6">
              <ShoppingCart className="w-10 h-10 text-[#8EA6BC] opacity-60" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-navy)] mb-2">Seu carrinho está vazio</h2>
            <p className="text-sm text-[var(--color-text-muted)] text-center max-w-[260px] mb-8">
              Encontre produtos para refrigeração e climatização e adicione os itens que deseja consultar ou comprar.
            </p>
            <Link to="/$countryCode/store" params={{ countryCode }} onClick={closeCart}>
              <Button variant="primary" size="sm" className="motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                Explorar produtos
              </Button>
            </Link>
          </div>
        )}

        {/* Cart Items */}
        {cart && itemCount > 0 && (
          <>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 motion-dropdown animate-in slide-in-from-bottom-2 fade-in-0 duration-[var(--motion-duration-medium)]">
              {sortedItems?.map((item) => (
                <div key={item.id} className="animate-in fade-in-0 duration-[var(--motion-duration-fast)]">
                  <CartLineItem
                    item={item}
                    cart={cart}
                    type="compact"
                    fields={DEFAULT_CART_DROPDOWN_FIELDS}
                  />
                </div>
              ))}
            </div>

            <DrawerFooter className="border-t border-[#E5EDF4] bg-[#F5F8FA] motion-dropdown animate-in slide-in-from-bottom-4 fade-in-0 duration-[var(--motion-duration-slow)]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-[var(--color-navy)]">Subtotal</span>
                <Price price={cart.item_subtotal ?? 0} currencyCode={cart.currency_code} className="text-xl font-bold text-[var(--color-primary)]" />
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/$countryCode/cart" params={{ countryCode }} onClick={closeCart} className="w-full">
                  <Button className="w-full bg-white border-2 border-[#E5EDF4] text-[var(--color-navy)] hover:bg-[#E5EDF4]/50 motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                    Ver carrinho
                  </Button>
                </Link>
                <Link to="/$countryCode/checkout" params={{ countryCode }} search={{ step: "address" as any }} onClick={closeCart} className="w-full">
                  <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" disabled={sortedItems?.some(item => !item.variant_id || item.quantity <= 0)}>
                    Finalizar compra
                  </Button>
                </Link>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  )
}

// Default export for backwards compatibility
export default CartLineItem
