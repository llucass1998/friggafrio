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

export function PublicProductCard({ product, compact = false, catalog = false, showInstallment = true, promotionLabel, reviewSummary }: PublicProductCardProps) {
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
  const catalogPhysicalStock = purchaseState.status === "purchasable"
    && purchaseState.variant.manage_inventory === true
    && typeof purchaseState.variant.inventory_quantity === "number"
    && purchaseState.variant.inventory_quantity > 0
  const catalogBackorder = purchaseState.status === "purchasable" && purchaseState.variant.allow_backorder === true && !catalogPhysicalStock
  const firstCalculatedPrice = firstVariant?.calculated_price
  const displayPrice = purchaseState.status === "purchasable"
    ? purchaseState.price
    : firstCalculatedPrice?.calculated_amount ?? 0
  const displayCurrency = countryCode === "br"
    ? "BRL"
    : firstCalculatedPrice?.currency_code || "BRL"
  const formattedDisplayPrice = displayPrice > 0
    ? formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrency })
    : null
  const originalDisplayPrice = firstCalculatedPrice?.original_amount
  const formattedOriginalPrice = typeof originalDisplayPrice === "number" && originalDisplayPrice > displayPrice
    ? formatCurrencyAmount({ amount: originalDisplayPrice, currencyCode: displayCurrency })
    : null
  const installment = purchaseState.status === "purchasable"
    ? getInterestFreeInstallment(displayPrice)
    : null
  const imageClassName = catalog
    ? "aspect-[4/3] bg-white p-2.5 sm:p-5"
    : compact
    ? "aspect-square bg-white p-3 sm:p-4"
    : "aspect-square bg-white p-3 sm:p-5"
  const contentClassName = catalog ? "p-3 sm:p-4" : compact ? "p-3" : "p-4"
  const titleClassName = catalog
    ? "line-clamp-3 min-h-[3rem] sm:min-h-[3.75rem] text-[0.85rem] sm:text-base font-bold leading-[1.25] text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-primary)]"
    : compact
    ? "line-clamp-3 min-h-[3rem] text-[0.9rem] font-bold leading-[1.25] text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-primary)] sm:text-[0.95rem]"
    : "line-clamp-3 min-h-[3.75rem] text-[0.95rem] font-bold leading-[1.25] text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-primary)] sm:text-base"

  return (
    <article data-testid="public-product-card" data-product-card-version="2" className={`ff-product-card ${catalog ? "ff-product-card--catalog" : ""} group relative box-border flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[12px] border border-[#D9E2EA] bg-white shadow-[0_4px_14px_rgba(15,45,75,0.10)]`}>
      <div className="absolute right-2 top-2 z-20 flex items-center gap-0.5">
        <FavoriteButton
          productId={product.id}
          productTitle={productTitle}
        />
        <QuickCartButton product={product} />
      </div>
      <Link
        to={"/$countryCode/products/$handle" as string}
        params={{ countryCode, handle: product.handle }}
        className="flex h-full flex-1 flex-col rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary)]"
        data-testid="product-card-link"
        aria-label={`Ver ${productTitle}`}
      >
        <div className={`relative block overflow-hidden ${imageClassName}`}>
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
              className="h-full w-full object-contain mix-blend-multiply"
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

        <div className={`flex flex-1 flex-col ${contentClassName}`}>
          {brand && (
            <p className="ff-product-card__brand mb-1 min-h-[1rem] text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {brand}
            </p>
          )}
          <h3 className={titleClassName}>{productTitle}</h3>
          <div className={catalog ? "mt-0 mb-1" : "my-1.5 min-h-4"}><ProductRating productId={product.id} summary={reviewSummary} /></div>
          {sku && (
            <span className="sr-only">SKU: {sku}</span>
          )}

          <div className={catalog || compact ? "mt-auto border-t border-[var(--color-border)] pt-2" : "mt-auto border-t border-[var(--color-border)] pt-3"}>
            <div className={compact ? "min-h-[46px] flex flex-col justify-end gap-1" : "min-h-[52px] flex flex-col justify-end gap-1"}>
              {purchaseState.status === "quote_only" ? (
                <>
                  <span className="w-fit rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Sob cotação</span>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Consulte condições comerciais</span>
                </>
              ) : purchaseState.status === "price_pending" ? (
                <>
                  <span className="w-fit rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">Valor em configuração</span>
                  <span className="text-sm font-medium text-[var(--color-text-muted)]">Consulte o valor</span>
                </>
              ) : purchaseState.status === "unavailable" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Disponibilidade não confirmada</span>
                  {formattedDisplayPrice && <span className="text-lg font-bold tracking-tight text-[var(--color-text-muted)]">{formattedDisplayPrice}</span>}
                </>
              ) : purchaseState.status === "out_of_stock" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Sem estoque</span>
                  {formattedDisplayPrice && <span className="text-lg font-bold tracking-tight text-[var(--color-text-muted)]">{formattedDisplayPrice}</span>}
                </>
              ) : purchaseState.status === "select_variant" ? (
                <>
                  <span className="w-fit rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs font-semibold text-sky-700">Escolha uma opção</span>
                  {formattedDisplayPrice && <span className="text-lg font-bold tracking-tight text-[var(--color-navy)]">A partir de {formattedDisplayPrice}</span>}
                </>
              ) : formattedDisplayPrice ? (
                <>
                  {promotionLabel && <span className="w-fit rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{promotionLabel}</span>}
                  {formattedOriginalPrice && <span className="text-xs text-[var(--color-text-muted)] line-through">{formattedOriginalPrice}</span>}
                  {catalog && catalogBackorder ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Sob encomenda</span>
                  ) : catalog && !catalogPhysicalStock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Disponibilidade desconhecida</span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-success)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Em estoque</span>
                  )}
                  <span className="text-xl font-bold tracking-tight text-[var(--color-navy)]">{formattedDisplayPrice}</span>
                  {showInstallment && installment && (
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      No Pix ou 10x de {formatCurrencyAmount({ amount: installment.installmentAmount, currencyCode: displayCurrency })}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm font-medium italic text-[var(--color-text-muted)]">Consulte o valor</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}
