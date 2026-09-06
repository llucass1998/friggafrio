import { Link } from "@tanstack/react-router"
import { useEffect } from "react"
import type { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import type { ProductReviewSummary } from "@/lib/data/product-review-summaries"
import { CarouselSectionHeader, CarouselSideControls, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

interface HomeProductSectionProps {
  countryCode: string
  title: string
  description: string
  products: HttpTypes.StoreProduct[]
  isLoading: boolean
  emptyMessage: string
  sectionId: string
  showAllProductsLink?: boolean
  hideWhenEmpty?: boolean
  reviewSummaries?: Record<string, ProductReviewSummary>
}

function ProductSkeleton() {
  return (
    <div className="ff-carousel-slide ff-product-slide flex h-full w-full flex-col overflow-hidden rounded-[12px] border border-[#D9E2EA] bg-white shadow-[0_4px_14px_rgba(15,45,75,0.10)]">
      <div className="aspect-square bg-white" />
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="h-4 w-1/3 rounded bg-gray-200" />
        <div className="h-6 w-full rounded bg-gray-200" />
        <div className="h-6 w-2/3 rounded bg-gray-200" />
        <div className="mt-auto h-10 w-full rounded bg-gray-200" />
      </div>
    </div>
  )
}

export function HomeProductSection({
  countryCode,
  title,
  description,
  products,
  isLoading,
  emptyMessage,
  sectionId,
  showAllProductsLink = false,
  hideWhenEmpty = false,
  reviewSummaries,
}: HomeProductSectionProps) {
  const { viewportRef, emblaApi, hasOverflow, canScrollPrev, canScrollNext, scrollToStart, scrollToEnd, onKeyDown } = useInfiniteCarousel([], false)

  // Product shelves mount after the query resolves; re-measure Embla when the
  // real slides replace the skeletons so controls reflect the mounted track.
  useEffect(() => {
    if (!emblaApi || isLoading) return
    const frame = window.requestAnimationFrame(() => emblaApi.reInit())
    return () => window.cancelAnimationFrame(frame)
  }, [emblaApi, isLoading, products.length])

  if (!isLoading && products.length === 0 && hideWhenEmpty) return null

  return (
    <section data-testid={sectionId} className="relative w-full bg-[var(--color-background)] py-8 md:py-10">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="py-1">
        <CarouselSectionHeader
          title={title}
          description={description}
          hasOverflow={hasOverflow}
          canScrollPrevious={canScrollPrev}
          canScrollNext={canScrollNext}
          onPrevious={scrollToStart}
          onNext={scrollToEnd}
          showControlsInHeader={false}
          previousLabel={`Ver produtos anteriores em ${title}`}
          nextLabel={`Ver próximos produtos em ${title}`}
          action={showAllProductsLink ? (
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              className="hidden rounded-sm text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] md:inline-flex"
            >
              Ver todos os produtos
            </Link>
          ) : undefined}
        />

        {isLoading ? (
          <div className="ff-carousel-viewport" data-carousel-viewport="true">
            <div className="ff-carousel-track" data-carousel-track="true">
              {Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)}
            </div>
          </div>
        ) : products.length > 0 ? (
          <div className="ff-carousel-stage">
            <CarouselSideControls side="previous" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollToStart} onNext={scrollToEnd} previousLabel={`Ver produtos anteriores em ${title}`} nextLabel={`Ver próximos produtos em ${title}`} />
            <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" tabIndex={0} aria-label={`${title}: produtos`} onKeyDown={onKeyDown}>
            <div className="ff-carousel-track" data-carousel-track="true">
              {products.map((product) => (
                <div key={product.id} className="ff-carousel-slide ff-product-slide flex min-w-0" data-carousel-slide="true">
                  <PublicProductCard
                    product={product}
                    compact
                    reviewSummary={reviewSummaries?.[product.id]}
                  />
                </div>
              ))}
            </div>
            </div>
            <CarouselSideControls side="next" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollToStart} onNext={scrollToEnd} previousLabel={`Ver produtos anteriores em ${title}`} nextLabel={`Ver próximos produtos em ${title}`} />
          </div>
        ) : (
          <p className="py-8 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
        )}
        </div>
      </div>
    </section>
  )
}
