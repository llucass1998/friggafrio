import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import { ProductOptionSelect } from "@/components/product-option-select"
import { useCartDrawer } from "@/lib/context/cart"
import { useAddToCart, useCart } from "@/lib/hooks/use-cart"
import { createProductWhatsAppUrl } from "@/lib/whatsapp"
import { getVariantOptionsKeymap, isVariantInStock } from "@/lib/utils/product"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getCountryCodeFromPath } from "@/lib/utils/region"
import { CheckoutStepKey } from "@/lib/types/global"
import type { HttpTypes } from "@medusajs/types"
import { useLocation, useNavigate } from "@tanstack/react-router"
import { isEqual } from "lodash-es"
import { memo, useEffect, useMemo, useState, type ReactNode } from "react"
import { Loader2, ShoppingCart, Check, MessageCircle, MapPin, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  afterActions?: ReactNode
  onVariantChange?: (variant: HttpTypes.StoreProductVariant | undefined) => void
}

const ProductActions = memo(function ProductActions({ product, region, disabled, afterActions, onVariantChange }: ProductActionsProps) {
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string | undefined>>({})
  const [quantity, setQuantity] = useState(1)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const countryCode = getCountryCodeFromPath(location.pathname) || "br"
  const queryClient = useQueryClient()
  const { openCart } = useCartDrawer()
  const { data: cart } = useCart({ fields: DEFAULT_CART_DROPDOWN_FIELDS })
  const addToCartMutation = useAddToCart({ fields: DEFAULT_CART_DROPDOWN_FIELDS })

  useEffect(() => {
    setSelectedOptions({})
    setQuantity(1)
  }, [product.handle])

  useEffect(() => {
    if (product.variants?.length !== 1) return
    setSelectedOptions(getVariantOptionsKeymap(product.variants[0]?.options ?? []) ?? {})
  }, [product.variants])

  const purchaseState = getProductPurchaseState(product)
  const productTitle = decodeProductText(product.title)
  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return undefined
    // A single variant has no commercial choice, even when Medusa exposes a
    // technical/default option alongside it; select it automatically.
    if (product.variants.length === 1) return product.variants[0]
    return product.variants.find((variant) => isEqual(getVariantOptionsKeymap(variant.options ?? []), selectedOptions))
  }, [product.variants, selectedOptions])

  useEffect(() => {
    onVariantChange?.(selectedVariant)
  }, [onVariantChange, selectedVariant])

  const canBuySelected = useMemo(() => {
    if (!selectedVariant) return false
    if (purchaseState.status !== "purchasable" && purchaseState.status !== "select_variant") return false
    const approved = purchaseState.status === "purchasable"
      ? purchaseState.variant.id === selectedVariant.id
      : purchaseState.variants.some((variant) => variant.id === selectedVariant.id)
    if (!approved || !isVariantInStock(selectedVariant)) return false
    const available = selectedVariant.manage_inventory === true ? selectedVariant.inventory_quantity : undefined
    return quantity >= 1 && (typeof available !== "number" || quantity <= available)
  }, [purchaseState, quantity, selectedVariant])

  const isInCart = Boolean(
    selectedVariant &&
    cart?.items?.some((item) => item.variant_id === selectedVariant.id || item.variant?.id === selectedVariant.id)
  )
  const isButtonGreen = isSuccess || isInCart

  const displayPrice = selectedVariant?.calculated_price?.calculated_amount
    ?? (purchaseState.status === "purchasable" ? purchaseState.price : undefined)
  const currencyCode = selectedVariant?.calculated_price?.currency_code || region.currency_code || "brl"
  const formattedPrice = typeof displayPrice === "number" && displayPrice > 0
    ? formatCurrencyAmount({ amount: displayPrice, currencyCode })
    : undefined
  const reference = product.variants?.[0]?.sku || undefined
  const whatsappUrl = createProductWhatsAppUrl({
    title: productTitle,
    reference,
    quantity,
    price: formattedPrice,
    // Keep the WhatsApp message identical during SSR and hydration.
    url: location.pathname,
  })
  const isBusy = addToCartMutation.isPending || isBuyingNow

  const handleCartAction = async (buyNow: boolean) => {
    if (!selectedVariant?.id || !canBuySelected || isBusy) return
    setIsBuyingNow(buyNow)
    try {
      await addToCartMutation.mutateAsync({
        variant_id: selectedVariant.id,
        quantity,
        country_code: countryCode,
        product,
        variant: selectedVariant,
        region,
      })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      if (buyNow) {
        await navigate({
          to: "/$countryCode/checkout",
          params: { countryCode },
          search: { step: CheckoutStepKey.ADDRESSES },
        })
      } else {
        setIsSuccess(true)
        openCart()
        toast.success(`${productTitle} adicionado ao carrinho`)
        window.setTimeout(() => setIsSuccess(false), 2000)
      }
    } catch {
      toast.error("Não foi possível adicionar o produto ao carrinho")
    } finally {
      setIsBuyingNow(false)
    }
  }

  const quoteState = purchaseState.status === "quote_only" || purchaseState.status === "price_pending"
  const statusCopy = purchaseState.status === "quote_only"
    ? "Este produto é vendido mediante orçamento."
    : purchaseState.status === "price_pending"
      ? "Consulte o preço e a disponibilidade com nossa equipe."
      : purchaseState.status === "out_of_stock"
        ? "Indisponível no momento"
        : purchaseState.status === "unavailable"
          ? "Compra indisponível para este produto"
          : null

  return (
    <>
    <div className="flex min-w-0 flex-col gap-4 pb-2 md:pb-0" aria-live="polite" data-testid="product-purchase-actions">
      <div>
        {quoteState ? (
          <>
            <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
              {purchaseState.status === "quote_only" ? "Sob orçamento" : "Preço sob consulta"}
            </span>
            <p className="mt-2 text-lg font-medium text-[var(--color-text-muted)]">{statusCopy}</p>
          </>
        ) : formattedPrice ? (
          <>
          <p className="text-[2rem] font-bold tracking-tight text-[var(--color-navy)] md:text-[2.25rem]">{formattedPrice}</p>
          </>
        ) : statusCopy ? (
          <p className="text-lg font-medium text-[var(--color-text-muted)]">{statusCopy}</p>
        ) : null}
      </div>

      {(product.variants?.length ?? 0) > 1 && (
        <div className="space-y-4 border-t border-[var(--color-border)] pt-4">
          {(product.options || []).map((option) => (
            <ProductOptionSelect
              key={option.id}
              option={option}
              current={selectedOptions[option.id]}
              updateOption={(optionId, value) => setSelectedOptions((current) => ({ ...current, [optionId]: value }))}
              data-testid="product-options"
              disabled={!!disabled || isBusy}
              product={product}
            />
          ))}
        </div>
      )}

      {canBuySelected && (
        <div className="grid gap-3 border-t border-[var(--color-border)] pt-4 sm:grid-cols-[135px_minmax(0,1fr)] sm:items-end">
          <div>
          <label htmlFor="product-quantity" className="mb-2 block text-sm font-semibold text-[var(--color-navy)]">Quantidade</label>
          <div className="flex h-12 items-center rounded-[9px] border border-[var(--color-border)] bg-white">
            <button type="button" aria-label="Diminuir quantidade" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={isBusy || quantity <= 1} className="h-11 w-11 shrink-0 text-lg text-[var(--color-navy)] disabled:opacity-40">−</button>
            <input
              id="product-quantity"
              type="number"
              min={1}
              max={selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number" ? selectedVariant.inventory_quantity : undefined}
              value={quantity}
              onChange={(event) => {
                const next = Number(event.target.value)
                if (!Number.isInteger(next)) return
                const max = selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number" ? selectedVariant.inventory_quantity : Number.MAX_SAFE_INTEGER
                setQuantity(Math.min(max, Math.max(1, next)))
              }}
              disabled={isBusy}
              className="h-full min-w-0 flex-1 border-x border-[var(--color-border)] text-center text-sm font-semibold text-[var(--color-navy)] focus:outline-none"
              aria-label="Quantidade do produto"
            />
            <button type="button" aria-label="Aumentar quantidade" onClick={() => setQuantity((value) => value + 1)} disabled={isBusy || (selectedVariant?.manage_inventory === true && typeof selectedVariant.inventory_quantity === "number" && quantity >= selectedVariant.inventory_quantity)} className="h-11 w-11 text-lg text-[var(--color-navy)] disabled:opacity-40">+</button>
          </div>
          </div>
          <button
            type="button"
            onClick={() => {
              if (isInCart) {
                openCart()
              } else {
                void handleCartAction(false)
              }
            }}
            disabled={isBusy}
            className={`inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border px-5 py-3 text-sm font-bold transition ${isButtonGreen ? "border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"} disabled:cursor-wait disabled:opacity-60`}
          >
            {isButtonGreen ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingCart className="h-4 w-4" aria-hidden="true" />}
            {isSuccess ? "Adicionado" : isInCart ? "No carrinho (ver carrinho)" : "Adicionar ao carrinho"}
          </button>
        </div>
      )}

      {canBuySelected && whatsappUrl && (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => void handleCartAction(true)} disabled={isBusy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[var(--color-primary)] bg-white px-5 py-3 text-sm font-bold text-[var(--color-primary)] transition hover:bg-[var(--color-surface-soft)] disabled:cursor-wait disabled:opacity-60">
            {isBuyingNow ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Comprar agora
          </button>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#a9dfbd] bg-[#edf9f0] px-5 py-3 text-sm font-semibold text-[#15753b] transition hover:bg-[#e0f5e6]">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />Comprar pelo WhatsApp
          </a>
        </div>
      )}

      {purchaseState.status === "select_variant" && !selectedVariant && <p className="text-sm font-medium text-amber-700">Selecione uma opção para continuar.</p>}
      {purchaseState.status === "out_of_stock" && <p className="text-sm font-medium text-rose-700">Sem estoque para compra imediata.</p>}

      {quoteState && whatsappUrl && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-button)] bg-[var(--color-primary)] px-5 py-3 text-sm font-bold text-white transition hover:bg-[var(--color-primary-hover)]">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Solicitar orçamento
        </a>
      )}

      {whatsappUrl && !canBuySelected && !quoteState && (
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[9px] border border-[#a9dfbd] bg-[#edf9f0] px-5 py-3 text-sm font-semibold text-[#15753b] transition hover:bg-[#e0f5e6]">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {quoteState ? "Falar com um especialista" : "Comprar pelo WhatsApp"}
        </a>
      )}

    </div>
    {afterActions}
    </>
  )
})

export default ProductActions

export function ProductTrustArguments() {
  return (
    <div className="grid gap-3 border-t border-[var(--color-border)] pt-4 text-xs text-[var(--color-text-muted)] sm:grid-cols-3" data-testid="product-trust-arguments">
      <span className="inline-flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" /><span><strong className="block text-[var(--color-navy)]">Compra segura</strong>Pagamento protegido</span></span>
      <span className="inline-flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" /><span><strong className="block text-[var(--color-navy)]">Retirada na loja</strong>Compre online e retire em nossa loja</span></span>
      <span className="inline-flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" aria-hidden="true" /><span><strong className="block text-[var(--color-navy)]">Atendimento técnico</strong>Nossa equipe está pronta para ajudar</span></span>
    </div>
  )
}
