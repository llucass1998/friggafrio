import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"
import { FavoriteButton } from "@/components/favorite-button"

import { useState } from "react"
import { useCartDrawer } from "@/lib/context/cart"
import { useQueryClient } from "@tanstack/react-query"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import { Loader2, ShoppingCart, Check, Star } from "lucide-react"
import { toast } from "sonner"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  isNew?: boolean
  badgeText?: string
}

export function PublicProductCard({ product, badgeText }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const thumbnail = product.thumbnail || product.images?.[0]?.url
  const productTitle = decodeProductText(product.title)
  const sku = product.variants?.[0]?.sku || "N/A"

  const brand = product.collection?.title || "FriggaFrio"
  const hasRealImages = Boolean(thumbnail)

  // Purchase state requires explicit price and inventory metadata.
  const purchaseState = getProductPurchaseState(product)

  // Resgata o preço geral
  const firstCalculatedPrice = product.variants?.[0]?.calculated_price
  const displayPrice = purchaseState.status === "purchasable"
    ? purchaseState.price
    : firstCalculatedPrice?.calculated_amount ?? 0
  const displayCurrency =
    countryCode === "br" ? "BRL" : firstCalculatedPrice?.currency_code || "BRL"
  const formattedDisplayPrice = displayPrice > 0
    ? formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrency })
    : null

  const { openCart } = useCartDrawer()
  const queryClient = useQueryClient()
  const [isSuccess, setIsSuccess] = useState(false)

  // Use a mutação do contexto oficial do Cart Medusa (evita quebra por CORS e usa o token correto)
  const addToCartMutation = useAddToCart({
    fields: DEFAULT_CART_DROPDOWN_FIELDS,
  })

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (purchaseState.status !== "purchasable" || addToCartMutation.isPending || isSuccess) return

    addToCartMutation.mutate(
      {
        variant_id: purchaseState.variant.id,
        quantity: 1,
        country_code: countryCode,
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["cart"] })
          setIsSuccess(true)
          openCart() // Drawer abre suavemente
          toast.success(`${productTitle} adicionado ao carrinho`)
          setTimeout(() => setIsSuccess(false), 2000)
        },
        onError: () => {
          // Error telemetry could go here
          toast.error("Não foi possível adicionar este produto ao carrinho. Tente novamente.")
        }
      }
    )
  }

  // Botão FASE 8 states
  let buttonText = "Adicionar ao carrinho"
  let buttonDisabled = true

  if (purchaseState.status === "purchasable") {
    buttonDisabled = false
  } else if (purchaseState.status === "select_variant") {
    buttonText = "Escolher opções"
    buttonDisabled = true // Navega pra página do produto no clique geral
  } else if (purchaseState.status === "out_of_stock") {
    buttonText = "Sem estoque"
  } else if (purchaseState.status === "quote_only") {
    buttonText = "Solicitar cotação"
  } else if (purchaseState.status === "price_pending") {
    buttonText = "Preço indisponível"
  } else {
    buttonText = "Indisponível"
  }

  // Em public card, se for "Escolher Opções", o clique do botão deve levar pra PDP
  const handleActionClick = (e: React.MouseEvent) => {
    if (purchaseState.status === "select_variant") {
      // Deixa o clique subir (propagação) pra disparar o Link que envolve o card, ou pode explicitamente mudar de pagina se precisar
      return
    }
    handleBuy(e)
  }

  return (
    <div data-testid="public-product-card" className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white transition-[transform,box-shadow,border-color] duration-[var(--motion-duration-card)] ease-[var(--motion-ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-md focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
      <FavoriteButton
        productId={product.id}
        productTitle={productTitle}
        className="absolute right-3 top-3 z-20"
      />
      {/* Image */}
      <Link
        to={"/$countryCode/products/$handle" as string}
        params={{ countryCode, handle: product.handle }}
        className="relative block aspect-[4/3] overflow-hidden bg-[var(--color-surface-soft)] p-3 focus-visible:outline-none sm:p-4"
      >
        {badgeText && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800 shadow-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
            {badgeText}
          </span>
        )}
        {!hasRealImages && (
          <span className="absolute bottom-2 right-2 z-10 rounded-[4px] bg-white/85 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] shadow-sm backdrop-blur-sm">
            Imagem em breve
          </span>
        )}

        {thumbnail && hasRealImages ? (
          <img
            src={thumbnail}
          alt={productTitle}
            loading="lazy"
            width="300"
            height="300"
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-[var(--motion-duration-card)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <ProductImagePlaceholder productName={productTitle} compact />
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
          {brand}
        </div>

        {/* Title */}
        <Link to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }} className="mb-1.5 rounded-sm focus-visible:outline-none">
          <h3 className="line-clamp-3 min-h-[3.75rem] text-[0.95rem] font-bold leading-[1.25] text-[var(--color-navy)] transition-colors hover:text-[var(--color-primary)] sm:text-base">
            {productTitle}
          </h3>
        </Link>

        {/* SKU */}
        <p className="mb-3 w-fit rounded bg-[var(--color-background)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)] sm:text-xs">
          Ref: {sku}
        </p>

        {/* Actions - Bottom aligned */}
        <div className="mt-auto border-t border-[var(--color-border)] pt-3">
          <div className="mb-3 flex min-h-[52px] flex-col justify-end gap-1">
             {purchaseState.status === "quote_only" ? (
               <>
                 <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   Sob cotação</span>
                 <span className="text-sm font-medium text-[var(--color-text-muted)]">Consulte condições comerciais</span>
               </>
             ) : purchaseState.status === "price_pending" ? (
               <>
                 <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   Valor em configuração
                 </span>
                 <span className="text-sm font-medium text-[var(--color-text-muted)]">Consulte o valor</span>
               </>
             ) : purchaseState.status === "out_of_stock" ? (
               <>
                 <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]">
                   <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                   Sem estoque
                 </span>
                 {displayPrice > 0 && (
                   <span className="text-lg font-bold tracking-tight text-[var(--color-text-muted)]">
                     {formattedDisplayPrice}
                   </span>
                 )}
               </>
             ) : displayPrice ? (
                 <>
                   <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-success)]">
                     <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                     Em estoque
                   </span>
                   <span className="text-xl font-bold tracking-tight text-[var(--color-navy)]">
                     {formattedDisplayPrice}
                   </span>
                 </>
             ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)] italic">Consulte o valor</span>
             )}
          </div>

          <button
            type="button"
            data-testid="product-card-cta"
            onClick={handleActionClick}
            disabled={(buttonDisabled && purchaseState.status !== "select_variant") || addToCartMutation.isPending || isSuccess}
            aria-label={`${buttonText} ${productTitle}`}
            className={`box-border inline-flex w-full min-h-[42px] min-w-0 max-w-full items-center justify-center rounded-[var(--radius-button-sm)] px-2 py-2 text-center text-xs font-semibold leading-snug transition-[background-color,border-color,box-shadow,transform] duration-[var(--motion-duration-interaction)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] sm:text-sm ${
              buttonDisabled && purchaseState.status !== "select_variant"
                ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200 shadow-none"
                : isSuccess
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:shadow-md motion-interactive"
            }`}
          >
            {addToCartMutation.isPending ? (
              <span className="flex min-w-0 max-w-full items-center justify-center gap-2 text-center">
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden="true" />
                <span className="min-w-0 break-words">Processando...</span>
              </span>
            ) : isSuccess ? (
              <span className="flex min-w-0 max-w-full items-center justify-center gap-2 text-center">
                <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">Adicionado</span>
              </span>
            ) : !buttonDisabled ? (
              <span className="flex min-w-0 max-w-full items-center justify-center gap-1.5 text-center">
                <ShoppingCart className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
                {buttonText === "Adicionar ao carrinho" ? (
                  <>
                    <span className="min-w-0 break-words sm:hidden">Adicionar</span>
                    <span className="hidden min-w-0 break-words sm:inline">Adicionar ao carrinho</span>
                  </>
                ) : <span className="min-w-0 break-words">{buttonText}</span>}
              </span>
            ) : (
              <span className="min-w-0 max-w-full break-words">{buttonText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
