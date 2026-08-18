import { Link } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

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
    <div className="animate-pulse flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-white">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="flex flex-1 flex-col gap-4 p-5">
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
  const trackRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const syncScrollState = useCallback(() => {
    const track = trackRef.current
    if (!track) return
    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth)
    setCanScrollLeft(track.scrollLeft > 1)
    setCanScrollRight(maxScroll - track.scrollLeft > 1)
  }, [])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    syncScrollState()
    track.addEventListener("scroll", syncScrollState, { passive: true })
    const resizeObserver = new ResizeObserver(syncScrollState)
    resizeObserver.observe(track)
    return () => {
      track.removeEventListener("scroll", syncScrollState)
      resizeObserver.disconnect()
    }
  }, [products.length, isLoading, syncScrollState])

  const scrollByPage = (direction: "left" | "right") => {
    const track = trackRef.current
    if (!track) return
    track.scrollBy({
      left: direction === "left" ? -(track.clientWidth * 0.82) : track.clientWidth * 0.82,
      behavior: "smooth",
    })
  }

  return (
    <section
      data-testid={sectionId}
      className="relative mb-12 w-full bg-white py-10 md:mb-16 md:py-14"
    >
      <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-[var(--color-navy)] md:text-3xl">{title}</h2>
            <p className="text-sm text-[var(--color-text-muted)] md:text-base">{description}</p>
          </div>
          {showAllProductsLink && (
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              className="hidden rounded-sm text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] md:inline-flex"
            >
              Ver todos os produtos
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="flex w-full gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, index) => <ProductSkeleton key={index} />)}
          </div>
        ) : products.length > 0 ? (
          <div className="relative -mx-1 px-1">
            <div
              id={`${sectionId}-track`}
              ref={trackRef}
              className="flex w-full gap-4 overflow-x-auto overscroll-x-contain scroll-smooth snap-x snap-mandatory scrollbar-hide"
              aria-label={`${title}: produtos`}
            >
              {products.map((product) => (
                <div key={product.id} className="w-[78vw] shrink-0 snap-start sm:w-[48%] lg:w-[31.5%] xl:w-[23.5%]">
                  <PublicProductCard
                    product={product}
                    badgeText={sectionId === "home-best-sellers" ? "Mais vendido" : undefined}
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label={`Ver produtos anteriores em ${title}`}
              aria-controls={`${sectionId}-track`}
              onClick={() => scrollByPage("left")}
              disabled={!canScrollLeft}
              className="absolute left-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-white/95 text-[var(--color-primary)] shadow-sm transition hover:border-[var(--color-primary)] hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Ver próximos produtos em ${title}`}
              aria-controls={`${sectionId}-track`}
              onClick={() => scrollByPage("right")}
              disabled={!canScrollRight}
              className="absolute right-0 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-white/95 text-[var(--color-primary)] shadow-sm transition hover:border-[var(--color-primary)] hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:flex"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <p className="py-8 text-sm text-[var(--color-text-muted)]">{emptyMessage}</p>
        )}
      </div>
    </section>
  )
}
