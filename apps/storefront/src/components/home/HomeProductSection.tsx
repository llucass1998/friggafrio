import { Link } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

interface HomeProductSectionProps {
  countryCode: string
  title: string
  description: string
  products: HttpTypes.StoreProduct[]
  isLoading: boolean
  emptyMessage: string
  sectionId: string
  showAllProductsLink?: boolean
}

function ProductSkeleton() {
  return (
    <div className="ff-carousel-slide ff-product-slide flex h-full w-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white">
      <div className="aspect-[16/10] bg-gray-200" />
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
}: HomeProductSectionProps) {
  const { viewportRef, hasOverflow, scrollPrev, scrollNext } = useInfiniteCarousel([], false)

  return (
    <section data-testid={sectionId} className="relative w-full bg-white py-8 md:py-10">
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <CarouselSectionHeader
          title={title}
          description={description}
          hasOverflow={hasOverflow}
          onPrevious={scrollPrev}
          onNext={scrollNext}
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
          <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" aria-label={`${title}: produtos`}>
            <div className="ff-carousel-track" data-carousel-track="true">
              {products.map((product) => (
                <div key={product.id} className="ff-carousel-slide ff-product-slide flex min-w-0" data-carousel-slide="true">
                  <PublicProductCard
                    product={product}
                    compact
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="py-8 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}
