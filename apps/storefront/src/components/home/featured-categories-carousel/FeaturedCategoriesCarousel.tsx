import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "@tanstack/react-router"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Category {
  id: string
  name: string
  handle: string
  metadata?: Record<string, any>
}

interface FeaturedCategoriesCarouselProps {
  categories: Category[]
  isLoading: boolean
  isError: boolean
  showEmptyState: boolean
  onRetry: () => void
}

export function FeaturedCategoriesCarousel({
  categories,
  isLoading,
  isError,
  showEmptyState,
  onRetry
}: FeaturedCategoriesCarouselProps) {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: false,
    loop: false,
    slidesToScroll: 1,
  })

  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false)
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false)

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setPrevBtnEnabled(emblaApi.canScrollPrev())
    setNextBtnEnabled(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="relative">
      {/* Header com botões de navegação */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-2">Categorias em Destaque</h2>
          <p className="text-[var(--color-text-muted)] text-sm md:text-base">Navegue pelas principais linhas de produtos</p>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to={"/$countryCode/store" as string}
            params={{ countryCode }}
            className="hidden md:inline-flex text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Ver todas as categorias
          </Link>

          {!isLoading && !isError && !showEmptyState && categories.length > 0 && (
            <div className="hidden md:flex gap-2">
              <button
                onClick={scrollPrev}
                disabled={!prevBtnEnabled}
                aria-label="Ver categoria anterior"
                aria-controls="featured-categories-viewport"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border)] text-[var(--color-navy)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={scrollNext}
                disabled={!nextBtnEnabled}
                aria-label="Ver próxima categoria"
                aria-controls="featured-categories-viewport"
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border)] text-[var(--color-navy)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Carrossel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-none w-full sm:w-1/2 md:w-1/3 lg:w-1/5 animate-pulse flex flex-col items-center text-center p-6 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)]">
              <div className="w-16 h-16 rounded-full bg-gray-200 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="text-center py-8">
          <p className="text-[var(--color-text-muted)] mb-4">Não foi possível carregar as categorias agora.</p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      ) : showEmptyState ? (
        <div className="text-center py-8 text-[var(--color-text-muted)]">
          Nenhuma categoria encontrada no momento.
        </div>
      ) : (
        <div
          className="overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0"
          ref={emblaRef}
          id="featured-categories-viewport"
        >
          <div className="flex gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex-none w-[85%] sm:w-[calc(50%-8px)] md:w-[calc(33.333%-10.66px)] lg:w-[calc(20%-12.8px)]"
              >
                <Link
                  to={"/$countryCode/store" as string}
                  params={{ countryCode }}
                  search={{ category: category.id }}
                  className="group flex flex-col items-center text-center p-6 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] h-full"
                >
                  <div className="w-16 h-16 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)] transition-colors overflow-hidden">
                    {category.metadata?.image && typeof category.metadata.image === "string" && category.metadata.image.startsWith("http") ? (
                      <img
                        src={category.metadata.image}
                        alt={category.name}
                        className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                          e.currentTarget.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <span
                      className={`text-2xl text-[var(--color-primary)] group-hover:text-white font-bold ${(category.metadata?.image && typeof category.metadata.image === "string" && category.metadata.image.startsWith("http")) ? "hidden" : ""}`}
                    >
                      {category.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[var(--color-navy)] text-sm">{category.name}</h3>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-4 md:hidden">
        {/* Botões mobile */}
        {!isLoading && !isError && !showEmptyState && categories.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
              aria-label="Ver categoria anterior"
              aria-controls="featured-categories-viewport"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border)] text-[var(--color-navy)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
              aria-label="Ver próxima categoria"
              aria-controls="featured-categories-viewport"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white border border-[var(--color-border)] text-[var(--color-navy)] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
        <Link
          to={"/$countryCode/store" as string}
          params={{ countryCode }}
          className="flex-1 inline-flex items-center justify-center py-3 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-surface-soft)] rounded-[var(--radius-button)] hover:bg-[var(--color-border)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          Ver todas as categorias
        </Link>
      </div>
    </div>
  )
}
