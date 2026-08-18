import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
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
import {
  cartCommercialStateLabel,
  getCartLineCommercialState,
  isCartCheckoutReady,
  sortCartItems,
  getCartItemCount,
} from "@/lib/utils/cart"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { getPricePercentageDiff } from "@/lib/utils/price"
import { decodeProductText } from "@/lib/utils/product-text"
import { useCartDrawer } from "@/lib/context/cart"
import { Minus, Plus, Trash, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Link, useLocation } from "@tanstack/react-router"
import { ShoppingCart } from "lucide-react"
import { clsx } from "clsx"
import { useEffect, useState } from "react"
import { toast } from "sonner"


type LineItemPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  currencyCode: string
  className?: string
}

export const LineItemPrice = ({ item, currencyCode, className }: LineItemPriceProps) => {
  const commercialState = getCartLineCommercialState(item as HttpTypes.StoreCartLineItem)

  if (commercialState === "quote_only") {
    return <span className={clsx("text-sm font-medium text-text-secondary", className)}>Sob consulta</span>
  }

  if (commercialState === "price_pending") {
    return <span className={clsx("text-sm font-medium text-text-secondary", className)}>Preço em configuração</span>
  }

  if (commercialState !== "standard") {
    return <span className={clsx("text-sm font-medium text-text-secondary", className)}>{cartCommercialStateLabel(commercialState)}</span>
  }

  const originalPrice = item.original_total
  const currentPrice = item.total
  if (typeof currentPrice !== "number") {
    return <span className={clsx("text-sm font-medium text-text-secondary", className)}>Preço a confirmar</span>
  }
  const hasReducedPrice = currentPrice !== null && currentPrice !== undefined && originalPrice !== null && originalPrice !== undefined && currentPrice < originalPrice

  return (
    <Price
      price={currentPrice}
      currencyCode={currencyCode}
      originalPrice={
        hasReducedPrice
          ? {
               price: originalPrice,
               percentage: getPricePercentageDiff(originalPrice, currentPrice),
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
  onRemoveStart?: (item: HttpTypes.StoreCartLineItem) => void
}

export const CartDeleteItem = ({ item, fields, onRemoveStart }: CartDeleteItemProps) => {
  const deleteLineItemMutation = useDeleteLineItem({ fields })
  return (
    <button
      type="button"
      onClick={() => {
        onRemoveStart?.(item)
        deleteLineItemMutation.mutate(
          { line_id: item.id },
          { onError: () => toast.error("Não foi possível remover este item do carrinho.") }
        )
      }}
      disabled={deleteLineItemMutation.isPending}
      aria-label={`Remover ${decodeProductText(item.product_title || item.title || "item")} do carrinho`}
      className="flex h-11 w-11 items-center justify-center rounded-lg text-text-muted transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] disabled:opacity-50"
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
  const variant = item.variant as (HttpTypes.StoreCartLineItem["variant"] & {
    inventory_quantity?: number | null
    manage_inventory?: boolean
  }) | undefined
  const inventoryLimit = variant?.manage_inventory === true && Number.isSafeInteger(variant.inventory_quantity)
    ? Math.max(0, Number(variant.inventory_quantity))
    : undefined

  const handleQuantityChange = (newQuantity: number) => {
    const normalizedQuantity = inventoryLimit === undefined
      ? newQuantity
      : Math.min(newQuantity, inventoryLimit)

    if (normalizedQuantity < 0) return

    if (normalizedQuantity === 0) {
      deleteLineItemMutation.mutate(
        { line_id: item.id },
        { onError: () => toast.error("Não foi possível atualizar a quantidade.") }
      )
    } else {
      updateLineItemMutation.mutate(
        { line_id: item.id, quantity: normalizedQuantity },
        { onError: () => toast.error("Não foi possível atualizar a quantidade.") }
      )
    }
  }

  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={() => handleQuantityChange(item.quantity - 1)}
        disabled={isPending}
        aria-label={`Diminuir quantidade de ${decodeProductText(item.product_title || item.title || "item")}`}
        className={clsx(
          "flex items-center justify-center transition-colors disabled:opacity-50",
          type === "compact"
            ? "h-9 w-9 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            : "h-11 w-11 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
        )}
      >
        <Minus className="w-4 h-4" />
      </button>
      <span
        className={clsx(
          "font-medium text-text-primary text-center",
          type === "compact"
            ? "text-sm min-w-[1.5rem]"
            : "text-base min-w-[2.5rem]"
        )}
      >
        {item.quantity}
      </span>
      <button
        type="button"
        onClick={() => handleQuantityChange(item.quantity + 1)}
        disabled={isPending || inventoryLimit === 0 || (inventoryLimit !== undefined && item.quantity >= inventoryLimit)}
        aria-label={`Aumentar quantidade de ${decodeProductText(item.product_title || item.title || "item")}`}
        className={clsx(
          "flex items-center justify-center transition-colors disabled:opacity-50",
          type === "compact"
            ? "h-9 w-9 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            : "h-11 w-11 text-text-secondary hover:text-text-primary hover:bg-surface-hover"
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
  onRemoveStart?: (item: HttpTypes.StoreCartLineItem) => void
}

const CompactCartLineItem = ({ item, cart, fields, onRemoveStart }: CartLineItemProps) => {
  const commercialState = getCartLineCommercialState(item)
  return (
    <div className="grid min-w-0 grid-cols-[72px_minmax(0,1fr)] items-start gap-3" data-testid="cart-item">
      <Thumbnail thumbnail={item.thumbnail} alt={decodeProductText(item.product_title || item.title || "")} className="h-[72px] w-[72px] rounded-md object-contain" />
      <div className="min-w-0 max-w-full">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="line-clamp-2 min-w-0 overflow-hidden text-ellipsis break-words text-sm font-semibold leading-tight text-zinc-900">
              {decodeProductText(item.product_title || item.title || "")}
            </h4>
            <div className="mt-1 line-clamp-2 min-w-0 overflow-hidden text-ellipsis break-words text-xs text-zinc-600">
              {item.variant_title && item.variant_title !== "Default Variant" && (
                <span>{decodeProductText(item.variant_title)}</span>
              )}
            </div>
          </div>
          <CartDeleteItem item={item} fields={fields} onRemoveStart={onRemoveStart} />
        </div>

        <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="min-w-0 justify-self-start">
            <CartItemQuantitySelector item={item} fields={fields} />
          </div>
          <div className="min-w-0 max-w-full whitespace-nowrap text-right">
            <LineItemPrice item={item} currencyCode={cart.currency_code} className="text-sm" />
          </div>
        </div>
        {commercialState !== "standard" && (
          <p className="mt-2 min-w-0 text-xs font-medium text-amber-800">{cartCommercialStateLabel(commercialState)}</p>
        )}
      </div>
    </div>
  )
}

const DisplayCartLineItem = ({ item, cart, className }: CartLineItemProps) => {
  const commercialState = getCartLineCommercialState(item)
  return (
    <div
      className={clsx(
        "flex items-center gap-4 py-3 border-b border-zinc-300 last:border-b-0",
        className
      )}
    >
      <Thumbnail
        thumbnail={item.thumbnail}
        alt={decodeProductText(item.product_title || item.title || "")}
        className="w-16 h-16"
      />
      <div className="flex-1">
        <p className="text-base font-semibold text-zinc-900">{decodeProductText(item.product_title || item.title || "")}</p>
        {item.variant_title && item.variant_title !== "Default Variant" && (
          <p className="text-sm text-zinc-600">{decodeProductText(item.variant_title)}</p>
        )}
        <p className="text-sm text-zinc-600">Quantidade: {item.quantity}</p>
      </div>
      <div className="text-right">
        <LineItemPrice item={item} currencyCode={cart.currency_code} />
      </div>
      {commercialState !== "standard" && (
        <p className="text-xs font-medium text-amber-800">{cartCommercialStateLabel(commercialState)}</p>
      )}
    </div>
  )
}

export const CartLineItem = ({
  item,
  cart,
  type = "default",
  fields,
  className,
  onRemoveStart,
}: CartLineItemProps) => {
  const commercialState = getCartLineCommercialState(item)
  if (type === "compact") {
    return <CompactCartLineItem item={item} cart={cart} fields={fields} className={className} onRemoveStart={onRemoveStart} />
  }

  if (type === "display") {
    return <DisplayCartLineItem item={item} cart={cart} className={className} />
  }

  return (
    <div className={clsx("flex items-center gap-5 px-5 py-4 transition-colors", className)}>
      <div className="flex-shrink-0">
        <div className="w-[88px] h-[88px] rounded-lg overflow-hidden bg-slate-50 border border-[#E2E8F0]">
          <Thumbnail
            thumbnail={item.thumbnail}
            alt={decodeProductText(item.product_title || item.title || "")}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-text-primary line-clamp-2 leading-snug">
              {decodeProductText(item.product_title || item.title || "")}
            </h3>
            {item.variant_title && item.variant_title !== "Default Variant" && (
              <p className="text-sm text-text-muted mt-0.5">{decodeProductText(item.variant_title)}</p>
            )}
            <div className="flex items-center gap-1 mt-3">
              <div className="flex items-center border border-[#E2E8F0] rounded-lg overflow-hidden">
                <CartItemQuantitySelector item={item} fields={fields} />
              </div>
              <CartDeleteItem item={item} fields={fields} />
            </div>
          </div>

          <div className="text-right sm:min-w-[100px]">
            <LineItemPrice item={item} currencyCode={cart.currency_code} className="text-base font-semibold" />
            {commercialState === "standard" && item.quantity > 1 && typeof item.total === "number" && (
              <p className="text-xs text-text-muted mt-1">
                <Price price={item.total / item.quantity} currencyCode={cart.currency_code} /> cada
              </p>
            )}
            {commercialState !== "standard" && (
              <p className="mt-1 text-xs font-medium text-amber-800">{cartCommercialStateLabel(commercialState)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}


interface CartSummaryProps {
  cart: HttpTypes.StoreCart
  /** When "page", hides tax line and shows shipping info hint */
  context?: "page" | "checkout"
}

export const CartSummary = ({ cart, context }: CartSummaryProps) => {
  if ("isOptimistic" in cart && cart.isOptimistic) {
    return <Loading />
  }
  const checkoutReady = isCartCheckoutReady(cart.items)
  const hasSelectedShipping = (cart.shipping_methods?.length ?? 0) > 0
  const hasPricedItems = checkoutReady && typeof cart.item_subtotal === "number"
  const isPage = context === "page"
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          {hasPricedItems ? <Price price={cart.item_subtotal!} currencyCode={cart.currency_code} className="text-text-primary font-medium" /> : <span className="text-text-muted text-sm">Sob consulta</span>}
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Frete</span>
          {hasSelectedShipping && typeof cart.shipping_total === "number" ? (
            <Price
              price={cart.shipping_total}
              currencyCode={cart.currency_code}
              className="text-text-primary font-medium"
            />
          ) : (
            <span className="text-text-muted text-sm">A calcular</span>
          )}
        </div>

        {/* Shipping hint — only on the cart page */}
        {isPage && !hasSelectedShipping && (
          <p className="text-xs text-text-muted">
            Opções e valores de entrega serão calculados no checkout.
          </p>
        )}

        {cart.discount_total !== null && cart.discount_total !== undefined && cart.discount_total > 0 ? (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Desconto</span>
            <Price
              price={cart.discount_total}
              currencyCode={cart.currency_code}
              type="discount"
              className="text-emerald-600 font-medium"
            />
          </div>
        ) : null}

        {/* Tax line — hide on cart page since it has no meaning at this stage */}
        {!isPage && (
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Impostos</span>
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
        )}
      </div>

      <div className="border-t border-border pt-4">
        <div className="flex justify-between items-center">
          <span className="text-base font-semibold text-text-primary">Total</span>
          {checkoutReady && hasSelectedShipping && typeof cart.total === "number" ? <Price price={cart.total} currencyCode={cart.currency_code} className="text-xl font-bold text-text-primary" /> : <span className="text-text-muted text-sm">A confirmar</span>}
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
  const promotions = cart.promotions ?? []

  const handleRemove = (code: string) => {
    removePromoCodeMutation.mutate(
      { code },
      { onError: () => toast.error("Não foi possível remover o cupom.") }
    )
  }

  const handleApply = () => {
    applyPromoCodeMutation.mutate(
      { code: promoCode },
      {
        onSuccess: () => {
          setShowInput(false)
          setPromoCode("")
        },
        onError: () => toast.error("Não foi possível aplicar o cupom."),
      }
    )
  }

  return (
    <div className="space-y-3">
      {promotions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {promotions.map((promotion, index) => (
            <div
              key={promotion.code || `promotion-${index}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium"
            >
              <span>{promotion.code}</span>
              <button
                type="button"
                onClick={() => handleRemove(promotion.code || "")}
                aria-label={`Remover cupom ${promotion.code || ""}`.trim()}
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
          type="button"
          onClick={() => setShowInput(true)}
          className="text-sm text-accent hover:text-accent-hover font-medium transition-colors"
        >
          + Adicionar cupom
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <label htmlFor="cart-promo-code" className="sr-only">Cupom de desconto</label>
            <Input
              id="cart-promo-code"
              placeholder="Digite o cupom"
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
              Aplicar
            </Button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowInput(false)
              setPromoCode("")
            }}
            className="text-xs text-text-muted hover:text-text-secondary transition-colors"
          >
            Cancelar
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


export const DEFAULT_CART_DROPDOWN_FIELDS = "id,*items,items.variant.id,items.variant.title,items.variant.thumbnail,items.variant.inventory_quantity,items.variant.manage_inventory,items.variant.allow_backorder,items.variant.product.id,items.variant.product.title,items.variant.product.thumbnail,total,+currency_code,item_subtotal"

export const CartDropdown = () => {
  const { isOpen, openCart, closeCart } = useCartDrawer()
  const { data: cart } = useCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })
  const location = useLocation()
  const countryCode = getCountryCodeFromPath(location.pathname) || "br"

  const sortedItems = sortCartItems(cart?.items || [])
  const [pendingRemovedItems, setPendingRemovedItems] = useState<HttpTypes.StoreCartLineItem[]>([])
  const sortedItemIds = sortedItems.map((item) => item.id).join("|")

  useEffect(() => {
    const currentItemIds = new Set(sortedItemIds ? sortedItemIds.split("|") : [])
    setPendingRemovedItems((current) =>
      current.filter((pendingItem) => !currentItemIds.has(pendingItem.id))
    )
  }, [sortedItemIds])

  const visibleItems = [
    ...sortedItems,
    ...pendingRemovedItems.filter(
      (pendingItem) => !sortedItems.some((item) => item.id === pendingItem.id)
    ),
  ]
  const itemCount = getCartItemCount(visibleItems)
  const checkoutReady = isCartCheckoutReady(visibleItems)

  const handleRemoveStart = (item: HttpTypes.StoreCartLineItem) => {
    setPendingRemovedItems((current) =>
      current.some((pendingItem) => pendingItem.id === item.id) ? current : [...current, item]
    )
  }

  const handleRemoveAnimationEnd = (itemId: string) => {
    setPendingRemovedItems((current) => current.filter((item) => item.id !== itemId))
  }

  return (
    <Drawer open={isOpen} onOpenChange={(open) => (open ? openCart() : closeCart())}>
      <DrawerContent
        data-testid="cart-drawer"
        className="z-[70] flex h-full min-w-0 max-w-[100vw] flex-col overflow-x-hidden border-l border-[#E5EDF4] sm:max-w-md"
        style={{ right: 0, left: "auto", bottom: 0 }}
        aria-describedby="cart-drawer-description"
      >
        <DrawerHeader className="border-b border-[#E5EDF4]">
          <DrawerTitle className="text-xl font-bold text-[var(--color-navy)]">Seu Carrinho</DrawerTitle>
          <div id="cart-drawer-description" className="sr-only">Lista de itens adicionados ao carrinho.</div>
        </DrawerHeader>

        {/* Empty Cart */}
        {(!cart || itemCount === 0) && (
          <div className="flex flex-1 flex-col items-center justify-center p-6 motion-cart-content">
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
            <div className="min-w-0 flex-1 space-y-6 overflow-x-hidden overflow-y-auto p-4 md:p-6 motion-cart-content">
              {visibleItems.map((item) => {
                const isPendingRemoval = pendingRemovedItems.some((pendingItem) => pendingItem.id === item.id)

                return (
                  <div
                    key={item.id}
                    className={isPendingRemoval ? "motion-cart-item-removing" : "motion-cart-item-enter"}
                    onAnimationEnd={() => {
                      if (isPendingRemoval) {
                        handleRemoveAnimationEnd(item.id)
                      }
                    }}
                  >
                    <CartLineItem
                      item={item}
                      cart={cart}
                      type="compact"
                      fields={DEFAULT_CART_DROPDOWN_FIELDS}
                      onRemoveStart={handleRemoveStart}
                    />
                  </div>
                )
              })}
            </div>

            <DrawerFooter className="border-t border-[#E5EDF4] bg-[#F5F8FA] motion-cart-content">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base font-bold text-[var(--color-navy)]">Subtotal</span>
                {checkoutReady && typeof cart.item_subtotal === "number" ? <Price price={cart.item_subtotal} currencyCode={cart.currency_code} className="text-xl font-bold text-[var(--color-primary)]" /> : <span className="text-sm text-[var(--color-text-muted)]">A confirmar</span>}
              </div>

              <div className="flex flex-col gap-2">
                <Link to="/$countryCode/cart" params={{ countryCode }} onClick={closeCart} className="w-full">
                  <Button className="w-full border-2 border-[var(--color-navy)] bg-white !text-[var(--color-navy)] shadow-sm hover:border-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:!text-white motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                    Ver carrinho
                  </Button>
                </Link>
                <Link to="/$countryCode/checkout" params={{ countryCode }} search={{ step: "address" as any }} onClick={(event) => { if (!checkoutReady) event.preventDefault(); else closeCart() }} className="w-full">
                  <Button className="w-full bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]" disabled={!checkoutReady}>
                    Ir para o checkout
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
