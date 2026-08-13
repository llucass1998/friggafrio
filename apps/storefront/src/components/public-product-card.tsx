import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"

import { useState } from "react"
import { useCartDrawer } from "@/lib/context/cart"
import { useQueryClient } from "@tanstack/react-query"
import { useAddToCart } from "@/lib/hooks/use-cart"
import { DEFAULT_CART_DROPDOWN_FIELDS } from "@/components/cart"
import { Loader2, ShoppingCart, Check } from "lucide-react"
import { toast } from "sonner"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getProductPurchaseState } from "@/lib/utils/product-state"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  isNew?: boolean
}

export function PublicProductCard({ product, isNew = false }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const thumbnail = product.thumbnail || product.images?.[0]?.url
  const sku = product.variants?.[0]?.sku || "N/A"

  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const brand = (metadata.brand as string) || product.collection?.title || "Friggafrio"
  const hasRealImages = metadata.has_real_images === true

  // Purchase state requires explicit price and inventory metadata.
  const purchaseState = getProductPurchaseState(product)

  // Resgata o preço geral
  const firstCalculatedPrice = product.variants?.[0]?.calculated_price
  const displayPrice = purchaseState.status === "purchasable"
    ? purchaseState.price
    : firstCalculatedPrice?.calculated_amount ?? 0
  const displayCurrency =
    countryCode === "br" ? "BRL" : firstCalculatedPrice?.currency_code || "BRL"

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
          toast.success(`${product.title} adicionado ao carrinho`)
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
  let buttonText = "Comprar"
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
    buttonText = "Solicitar orçamento"
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
    <div className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white transition-[transform,box-shadow,border-color] duration-[var(--motion-duration-card)] ease-[var(--motion-ease-standard)] hover:-translate-y-0.5 hover:border-[var(--color-primary)] hover:shadow-lg focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
      {/* Image */}
      <Link
        to={"/$countryCode/products/$handle" as string}
        params={{ countryCode, handle: product.handle }}
        className="block relative aspect-square bg-[var(--color-surface-soft)] overflow-hidden p-6 focus-visible:outline-none"
      >
        {(isNew || metadata.is_new === true) && (
          <span className="absolute top-3 left-3 z-10 px-2 py-1 text-xs font-semibold text-[var(--color-navy)] bg-[var(--color-accent)] rounded-[4px] uppercase tracking-wide shadow-sm">
            Novo
          </span>
        )}

        {!hasRealImages && (
          <span className="absolute bottom-3 right-3 z-10 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] bg-white/80 backdrop-blur-sm rounded-[4px] shadow-sm">
            Imagem em breve
          </span>
        )}

        {thumbnail && hasRealImages ? (
          <img
            src={thumbnail}
            alt={product.title}
            loading="lazy"
            width="300"
            height="300"
            className="h-full w-full object-contain mix-blend-multiply transition-transform duration-[var(--motion-duration-card)] ease-[var(--motion-ease-standard)] group-hover:scale-[1.02] motion-reduce:transform-none motion-reduce:transition-none"
          />
        ) : (
          <ProductImagePlaceholder productName={product.title} />
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
          {brand}
        </div>

        {/* Title */}
        <Link to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }} className="mb-2 focus-visible:outline-none rounded-sm">
          <h3 className="font-bold text-[var(--color-navy)] leading-tight hover:text-[var(--color-primary)] transition-colors line-clamp-3 min-h-[3rem]">
            {product.title}
          </h3>
        </Link>

        {/* SKU */}
        <p className="text-xs text-[var(--color-text-muted)] mb-4 font-mono bg-[var(--color-background)] px-2 py-1 rounded w-fit">
          Ref: {sku}
        </p>

        {/* Actions - Bottom aligned */}
        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          <div className="flex flex-col gap-1 mb-4 min-h-[40px] justify-end">
             {purchaseState.status === "quote_only" ? (
               <>
                 <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   QUOTE_ONLY · Somente sob cotação
                 </span>
                 <span className="text-sm font-medium text-[var(--color-text-muted)]">Consulte condições comerciais</span>
               </>
             ) : purchaseState.status === "price_pending" ? (
               <>
                 <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   Valor em configuração
                 </span>
                 <span className="text-sm font-medium text-[var(--color-text-muted)]">Consulte o valor</span>
               </>
             ) : displayPrice ? (
                 <span className="text-xl font-bold text-[var(--color-navy)]">
                   {formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrency })}
                 </span>
             ) : (
                <span className="text-sm font-medium text-[var(--color-text-muted)] italic">Consulte o valor</span>
             )}
          </div>

          <button
            onClick={handleActionClick}
            disabled={(buttonDisabled && purchaseState.status !== "select_variant") || addToCartMutation.isPending || isSuccess}
            aria-label={`${buttonText} ${product.title}`}
            className={`flex min-h-[44px] w-full items-center justify-center rounded-[var(--radius-button-sm)] px-3 py-2.5 text-sm font-semibold transition-[background-color,border-color,box-shadow,transform] duration-[var(--motion-duration-interaction)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] ${
              buttonDisabled && purchaseState.status !== "select_variant"
                ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200 shadow-none"
                : isSuccess
                  ? "bg-green-600 text-white hover:bg-green-700 shadow-sm"
                  : "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] hover:shadow-md motion-interactive"
            }`}
          >
            {addToCartMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </span>
            ) : isSuccess ? (
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Adicionado
              </span>
            ) : !buttonDisabled ? (
              <span className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                {buttonText}
              </span>
            ) : (
              buttonText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
