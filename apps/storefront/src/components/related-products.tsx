import type { HttpTypes } from "@medusajs/types"
import { useEffect } from "react"
import { useRelatedProducts } from "@/lib/hooks/use-products"
import { PublicProductCard } from "@/components/public-product-card"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  regionId: string
}

export function RelatedProducts({ product, regionId }: RelatedProductsProps) {
  const { data: products = [], isLoading, isError } = useRelatedProducts({
    product,
    region_id: regionId,
  })
  const { viewportRef, emblaApi, hasOverflow, canScrollPrev, canScrollNext, scrollPrev, scrollNext } = useInfiniteCarousel([], false)

  useEffect(() => {
    if (!emblaApi || isLoading) return
    const frame = window.requestAnimationFrame(() => emblaApi.reInit())
    return () => window.cancelAnimationFrame(frame)
  }, [emblaApi, isLoading, products.length])

  if (isError || (!isLoading && products.length === 0)) return null

  return (
    <section className="mx-auto mt-12 w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="p-0 sm:p-0">
        <CarouselSectionHeader
          title="Produtos relacionados"
          description="Para completar sua compra"
          hasOverflow={hasOverflow}
          canScrollPrevious={canScrollPrev}
          canScrollNext={canScrollNext}
          onPrevious={scrollPrev}
          onNext={scrollNext}
          previousLabel="Ver produtos relacionados anteriores"
          nextLabel="Ver prÃ³ximos produtos relacionados"
        />
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 animate-pulse rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white" />)}
        </div>
      ) : (
        <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" aria-label="Produtos relacionados">
          <div className="ff-carousel-track" data-carousel-track="true">
            {products.map((related) => (
              <div key={related.id} className="ff-carousel-slide ff-product-slide flex min-w-0" data-carousel-slide="true">
                <PublicProductCard product={related} compact />
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </section>
  )
}

export default RelatedProducts
