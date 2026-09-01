import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"
import { FavoriteButton } from "@/components/favorite-button"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { decodeProductText } from "@/lib/utils/product-text"
import { getInterestFreeInstallment } from "@/lib/utils/installments"
import ProductRating from "@/components/product-rating"
import { resolveMediaUrl } from "@/lib/media-url"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  compact?: boolean
}

export function PublicProductCard({ product, compact = false }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const thumbnail = resolveMediaUrl(product.thumbnail || product.images?.[0]?.url)
  const productTitle = decodeProductText(product.title)
  const sku = product.variants?.[0]?.sku?.trim() || null
  const brand = product.collection?.title || "FriggaFrio"
  const purchaseState = getProductPurchaseState(product)
  const firstCalculatedPrice = product.variants?.[0]?.calculated_price
  const displayPrice = purchaseState.status === "purchasable"
    ? purchaseState.price
    : firstCalculatedPrice?.calculated_amount ?? 0
  const displayCurrency = countryCode === "br"
    ? "BRL"
    : firstCalculatedPrice?.currency_code || "BRL"
  const formattedDisplayPrice = displayPrice > 0
    ? formatCurrencyAmount({ amount: displayPrice, currencyCode: displayCurrency })
    : null
  const installment = purchaseState.status === "purchasable"
    ? getInterestFreeInstallment(displayPrice)
    : null
  const imageClassName = compact
    ? "aspect-[16/10] bg-[var(--color-surface-soft)] p-2 sm:p-3"
    : "aspect-[4/3] bg-[var(--color-surface-soft)] p-3 sm:p-4"
  const contentClassName = compact ? "p-3" : "p-4"
  const titleClassName = compact
    ? "line-clamp-3 min-h-[3rem] text-[0.9rem] font-bold leading-[1.25] text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-primary)] sm:text-[0.95rem]"
    : "line-clamp-3 min-h-[3.75rem] text-[0.95rem] font-bold leading-[1.25] text-[var(--color-navy)] transition-colors group-hover:text-[var(--color-primary)] sm:text-base"

  return (
    <article data-testid="public-product-card" data-product-card-version="2" className="group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white transition-[box-shadow,border-color] duration-[var(--motion-duration-card)] ease-[var(--motion-ease-standard)] hover:border-[var(--color-primary)] hover:shadow-md focus-within:ring-2 focus-within:ring-[var(--color-primary)]">
      <FavoriteButton
        productId={product.id}
        productTitle={productTitle}
        className="absolute right-3 top-3 z-20"
      />
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
          {thumbnail ? (
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
        </div>

        <div className={`flex flex-1 flex-col ${contentClassName}`}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
            {brand}
          </p>
          <h3 className={titleClassName}>{productTitle}</h3>
          <div className="mt-2 min-h-4"><ProductRating productId={product.id} /></div>
          {sku && (
            <p className={`${compact ? "mb-2" : "mb-3"} mt-1.5 w-fit rounded bg-[var(--color-background)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-text-muted)] sm:text-xs`}>
              Ref: {sku}
            </p>
          )}

          <div className={`mt-auto border-t border-[var(--color-border)] ${compact ? "pt-2" : "pt-3"}`}>
            <div className={`${compact ? "min-h-[46px]" : "min-h-[52px]"} flex flex-col justify-end gap-1`}>
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
              ) : purchaseState.status === "out_of_stock" ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-danger)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Sem estoque</span>
                  {formattedDisplayPrice && <span className="text-lg font-bold tracking-tight text-[var(--color-text-muted)]">{formattedDisplayPrice}</span>}
                </>
              ) : formattedDisplayPrice ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-success)]"><span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />Em estoque</span>
                  <span className="text-xl font-bold tracking-tight text-[var(--color-navy)]">{formattedDisplayPrice}</span>
                  {installment && <span className="text-xs font-medium text-[var(--color-text-muted)]">{installment.label}</span>}
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
