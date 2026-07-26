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

  // Forçamos uma análise resiliente que permite os itens aparecerem se faltar inventário de backend local
  // O carrinho vai lidar com as travas finais baseadas na API
  let purchaseState = getProductPurchaseState(product)

  // Em public cards (listagem, vitrine, etc.), se a validação "select_variant" ocorrer, nós marcamos como selecionável
  // para que o botão vire "Escolher opções" e leve a PDP ao invés de barrar
  if (purchaseState.status === "out_of_stock") {
    // Se o backend retornou nulo na query de inventário mas o item existe e tem preço na StoreAPI, liberamos o front.
    const variantsWithPrice = (product.variants ?? []).filter(
      (variant) => variant.calculated_price?.calculated_amount != null
    )
    if (variantsWithPrice.length === 1 && product.variants?.length === 1) {
      const variant = variantsWithPrice[0]
      purchaseState = {
        status: "purchasable",
        variant,
        price: variant.calculated_price?.calculated_amount ?? 0,
      }
    } else if (product.variants && product.variants.length > 1) {
      purchaseState = { status: "select_variant", variants: product.variants }
    }
  }

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
        onError: (err) => {
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
  } else if (purchaseState.status === "price_pending") {
    buttonText = "Preço em confirmação"
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
    <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden transition-all duration-[var(--motion-duration-card,300ms)] ease-[var(--ease-standard,cubic-bezier(0.2,0.8,0.2,1))] hover:-translate-y-[5px] hover:shadow-lg hover:border-[var(--color-primary)] group flex flex-col h-full focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
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
            className="w-full h-full object-contain mix-blend-multiply transition-transform duration-[var(--motion-duration-card,300ms)] ease-out group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
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
             {displayPrice && purchaseState.status === "price_pending" ? (
               <>
                 <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   Valor em configuração
                 </span>
                 <span className="text-xl font-bold text-[var(--color-text)]">
                   {formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrency })}
                 </span>
               </>
             ) : displayPrice && purchaseState.status !== "price_pending" ? (
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
            className={`flex items-center justify-center w-full min-h-[44px] px-3 py-2.5 text-sm font-semibold rounded-[var(--radius-button-sm)] transition-all duration-[160ms] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] active:scale-[0.98] ${
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
