import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"
import { FavoriteButton } from "@/components/favorite-button"
import { QuickCartButton } from "@/components/quick-cart-button"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"
import { getInterestFreeInstallment } from "@/lib/utils/installments"
import ProductRating, { type ProductRatingSummary } from "@/components/product-rating"
import { resolveMediaUrl } from "@/lib/media-url"
import { useState } from "react"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  compact?: boolean
  catalog?: boolean
  showInstallment?: boolean
  promotionLabel?: string
  reviewSummary?: ProductRatingSummary
}

export function PublicProductCard({
  product,
  compact = false,
  catalog = false,
  showInstallment = true,
  promotionLabel,
  reviewSummary,
}: PublicProductCardProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const rawThumbnail = product.thumbnail || product.images?.[0]?.url
  const thumbnail = resolveMediaUrl(rawThumbnail)
  const [imageFailed, setImageFailed] = useState(false)
  const [useOriginalThumbnail, setUseOriginalThumbnail] = useState(false)
  const productTitle = decodeProductText(product.title)
  const firstVariant = product.variants?.[0]
  const sku = firstVariant?.sku?.trim() || firstVariant?.barcode?.trim() || firstVariant?.ean?.trim() || firstVariant?.upc?.trim() || null
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const metadataBrand = typeof metadata.brand === "string" ? metadata.brand.trim() : ""
  const metadataManufacturer = typeof metadata.manufacturer === "string" ? metadata.manufacturer.trim() : ""
  const brand = product.collection?.title?.trim() || metadataBrand || metadataManufacturer || null
  const purchaseState = getProductPurchaseState(product)
    const firstCalculatedPrice = firstVariant?.calculated_price
  const displayPrice =
    purchaseState.status === "purchasable"
      ? purchaseState.price
      : firstCalculatedPrice?.calculated_amount ?? 0
  const displayCurrency =
    countryCode === "br" ? "BRL" : firstCalculatedPrice?.currency_code || "BRL"
  const formattedDisplayPrice =
    displayPrice > 0
      ? formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrency })
      : null
  const originalDisplayPrice = firstCalculatedPrice?.original_amount
  const formattedOriginalPrice =
    typeof originalDisplayPrice === "number" && originalDisplayPrice > displayPrice
      ? formatCurrencyAmount({ amount: originalDisplayPrice, currencyCode: displayCurrency })
      : null
  const discountPercentage =
    typeof originalDisplayPrice === "number" && originalDisplayPrice > displayPrice
      ? Math.round(((originalDisplayPrice - displayPrice) / originalDisplayPrice) * 100)
      : null
  const discountBadge =
    promotionLabel ||
    (discountPercentage ? `-${discountPercentage}%` : formattedOriginalPrice ? "-13%" : null)
  const installment =
    purchaseState.status === "purchasable" ? getInterestFreeInstallment(displayPrice) : null

  const imageClassName = catalog
    ? "aspect-[4/3] bg-white p-2 sm:p-3"
    : compact
    ? "aspect-square bg-white p-2 sm:p-3"
    : "aspect-square bg-white p-2.5 sm:p-4"
  const titleClassName = catalog
    ? "line-clamp-2 min-h-[2.4rem] text-xs sm:text-sm font-medium leading-snug text-slate-800 transition-colors group-hover:text-[var(--color-primary)]"
    : compact
    ? "line-clamp-2 min-h-[2.4rem] text-xs font-medium leading-snug text-slate-800 transition-colors group-hover:text-[var(--color-primary)] sm:text-sm"
    : "line-clamp-2 min-h-[2.4rem] text-xs sm:text-sm font-medium leading-snug text-slate-800 transition-colors group-hover:text-[var(--color-primary)]"

  return (
    <article
      data-testid="public-product-card"
      data-product-card-version="3"
      className={`ff-product-card ${catalog ? "ff-product-card--catalog" : ""} group relative box-border flex h-full w-full min-w-0 flex-col justify-between overflow-visible rounded-2xl border border-slate-100 bg-white p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-all duration-200 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]`}
    >
      {/* 1. Topo: Estrela e Nota à esquerda | Favorito e Carrinho à direita */}
      <div className="flex items-center justify-between z-10">
        <div className="flex min-h-5 items-center">
          <ProductRating productId={product.id} summary={reviewSummary} />
        </div>
        <div className="flex items-center gap-1">
          <FavoriteButton productId={product.id} productTitle={productTitle} />
          <QuickCartButton product={product} />
        </div>
      </div>

      {/* 2. Link do produto com imagem centralizada e dados */}
      <Link
        to={"/$countryCode/products/$handle" as string}
        params={{ countryCode, handle: product.handle }}
        className="flex h-full flex-1 flex-col justify-between rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary)]"
        data-testid="product-card-link"
        aria-label={`Ver ${productTitle}`}
      >
        {/* Imagem perfeitamente centralizada e proporcional */}
        <div className={`relative my-2 flex w-full items-center justify-center overflow-hidden bg-white ${imageClassName}`}>
          {!thumbnail && (
            <span className="absolute bottom-2 right-2 z-10 rounded-[4px] bg-white/85 px-2 py-1 text-[10px] font-medium text-[var(--color-text-muted)] backdrop-blur-sm">
              Imagem em breve
            </span>
          )}
          {thumbnail && !imageFailed ? (
            <img
              src={useOriginalThumbnail ? rawThumbnail || thumbnail : thumbnail}
              alt={productTitle}
              loading="lazy"
              width="300"
              height="300"
              className="h-full w-full object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
              onError={() => {
                if (rawThumbnail && thumbnail && rawThumbnail !== thumbnail && !useOriginalThumbnail) {
                  setUseOriginalThumbnail(true)
                  return
                }
                setImageFailed(true)
              }}
            />
          ) : (
            <ProductImagePlaceholder productName={productTitle} compact />
          )}
        </div>

        {/* 3. Textos e Preços inferiores (SEM A LINHA DIVISÓRIA) */}
        <div className="flex flex-1 flex-col justify-between pt-1">
          <div className="flex flex-col gap-0.5 text-left">
            {brand && (
              <p className="ff-product-card__brand text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {brand}
              </p>
            )}
            <h3 className={titleClassName}>{productTitle}</h3>
            {sku && (
              <span className="sr-only">SKU: {sku}</span>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1 text-left">
            {purchaseState.status === "quote_only" ? (
              <>
                <span className="w-fit rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Sob cotação
                </span>
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Consulte o valor
                </span>
              </>
            ) : purchaseState.status === "price_pending" ? (
              <>
                <span className="w-fit rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  Valor em configuração
                </span>
                <span className="text-sm font-medium text-[var(--color-text-muted)]">
                  Consulte o valor
                </span>
              </>
            ) : purchaseState.status === "out_of_stock" ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  Sem estoque
                </span>
                {formattedDisplayPrice && (
                  <span className="text-base font-bold text-slate-900 sm:text-lg">
                    {formattedDisplayPrice}
                  </span>
                )}
              </>
            ) : purchaseState.status === "unavailable" ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
                  Disponibilidade não confirmada
                </span>
                {formattedDisplayPrice && (
                  <span className="text-base font-bold text-slate-900 sm:text-lg">
                    {formattedDisplayPrice}
                  </span>
                )}
              </>
            ) : purchaseState.status === "select_variant" ? (
              <>
                <span className="w-fit rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">
                  Escolha uma opção
                </span>
                {formattedDisplayPrice && (
                  <span className="text-base font-bold text-slate-900 sm:text-lg">
                    A partir de {formattedDisplayPrice}
                  </span>
                )}
              </>
            ) : formattedDisplayPrice ? (
              <>
                {formattedOriginalPrice && (
                  <span className="text-[11px] text-slate-400 line-through">
                    {formattedOriginalPrice}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 sm:text-lg">
                    {formattedDisplayPrice}
                  </span>
                  {discountBadge && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                      {discountBadge}
                    </span>
                  )}
                </div>
                {showInstallment && installment && (
                  <span className="text-[11px] text-slate-500">
                    No Pix ou 10x de{" "}
                    {formatCurrencyAmount({
                      amount: installment.installmentAmount,
                      currencyCode: displayCurrency,
                    })}
                  </span>
                )}
              </>
            ) : (
              <span className="text-sm font-medium italic text-[var(--color-text-muted)]">
                Consulte o valor
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}



