import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"
import { useRelatedProducts } from "@/lib/hooks/use-products"
import { PublicProductCard } from "@/components/public-product-card"
import { CarouselSectionHeader, CarouselSideControls, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  regionId: string
}

export function RelatedProducts({ product, regionId }: RelatedProductsProps) {
  const { countryCode = "br" } = useParams({ strict: false }) as { countryCode?: string }
  const { data: products = [], isLoading, isError } = useRelatedProducts({
    product,
    region_id: regionId,
  })
  const { viewportRef, emblaApi, hasOverflow, canScrollPrev, canScrollNext, scrollPrev, scrollNext, onKeyDown } = useInfiniteCarousel([], false)

  useEffect(() => {
    if (!emblaApi || isLoading) return
    const frame = window.requestAnimationFrame(() => emblaApi.reInit())
    return () => window.cancelAnimationFrame(frame)
  }, [emblaApi, isLoading, products.length])

  if (isError || (!isLoading && products.length === 0)) return null

  return (
    <section className="ff-related-products mx-auto mt-8 w-[calc(100%-24px)] max-w-[1236px] pb-10 sm:w-[calc(100%-32px)] lg:w-[calc(100%-48px)]">
      <div className="p-0 sm:p-0">
        <CarouselSectionHeader
          title="Produtos complementares"
          action={<Link to="/$countryCode/store" params={{ countryCode }} className="text-sm font-semibold text-[var(--color-primary)] hover:underline">Ver todos <span aria-hidden="true">→</span></Link>}
          hasOverflow={hasOverflow}
          canScrollPrevious={canScrollPrev}
          canScrollNext={canScrollNext}
          showControlsInHeader={false}
          onPrevious={scrollPrev}
          onNext={scrollNext}
          previousLabel="Ver produtos complementares anteriores"
          nextLabel="Ver próximos produtos complementares"
        />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white" />)}
        </div>
      ) : (
        <div className="ff-carousel-stage ff-product-carousel-stage" onKeyDown={onKeyDown}>
          <CarouselSideControls side="previous" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollPrev} onNext={scrollNext} previousLabel="Ver produtos complementares anteriores" nextLabel="Previous complementary products" />
          <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" aria-label="Produtos complementares">
          <div className={`ff-carousel-track${products.length <= 2 ? " ff-carousel-track--short" : ""}`} data-carousel-track="true">
            {products.map((related) => (
              <div key={related.id} className="ff-carousel-slide ff-product-slide flex min-w-0" data-carousel-slide="true">
              <PublicProductCard product={related} compact showInstallment={true} />
              </div>
            ))}
          </div>
          </div>
          <CarouselSideControls side="next" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollPrev} onNext={scrollNext} previousLabel="Ver produtos relacionados anteriores" nextLabel="Next related products" />
        </div>
      )}
      </div>
    </section>
  )
}

export default RelatedProducts
