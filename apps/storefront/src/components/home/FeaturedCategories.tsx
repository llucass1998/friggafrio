import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { listCategories } from "@/lib/data/categories"
import { useHydrated } from "@/lib/hooks/use-hydrated"

const CATEGORY_ASSET_HANDLES = new Set([
  "bombas-de-vacuo",
  "camara-fria",
  "cilindros-de-recolhimento",
  "componentes",
  "compressores",
  "conexoes",
  "detectores-de-vazamento",
  "ferramentas-manuais",
  "gases-refrigerantes",
  "isolamento-termico",
  "manifolds-e-manometros",
  "oleos",
  "produtos-quimicos",
  "recolhedoras",
  "tubos-de-cobre",
  "outros",
])

export function CategoryIllustration({ handle, name }: { handle?: string; name: string }) {
  const normalizedHandle = handle && CATEGORY_ASSET_HANDLES.has(handle) ? handle : "componentes"
  const assetSource = `/images/category-illustrations.svg#${normalizedHandle}`

  return (
    <svg
      data-category-illustration="true"
      data-asset-source={assetSource}
      className="h-[76px] w-[104px] text-[var(--color-primary)] transition-transform duration-[var(--motion-duration-card)] group-hover:scale-[1.03] motion-reduce:transition-none"
      viewBox="0 0 120 90"
      role="img"
      aria-label={`Ilustração de ${name}`}
    >
      <use href={assetSource} />
    </svg>
  )
}

export function FeaturedCategories() {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const hydrated = useHydrated()
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    enabled: hydrated,
    retry: 1,
  })
  const isLoading = !hydrated || categoriesQuery.isPending
  const categories = categoriesQuery.data || []
  const ignoredHandles = ["attachments", "forklift-parts", "material-handling", "operator-accessories", "safety-equipment", "warehouse-equipment"]
  const isTechnicalFallback = (category: (typeof categories)[number]) => {
    const handle = category.handle?.trim().toLowerCase()
    const name = category.name?.trim().toLowerCase()
    return handle === "outros" || name === "outros"
  }
  const mainCategories = categories
    .filter((category) => category.handle && !category.parent_category_id)
    .filter((category) => !ignoredHandles.includes(category.handle))
    .filter((category) => category.metadata?.featured === true)
    .filter((category) => !isTechnicalFallback(category))
    .slice(0, 12)

  const trackRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [scrollState, setScrollState] = useState({ canPrevious: false, canNext: false })

  const updateScrollState = () => {
    const track = trackRef.current
    if (!track) return
    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth)
    const currentScrollLeft = Math.max(0, track.scrollLeft)
    setScrollState({
      canPrevious: currentScrollLeft > 1,
      canNext: maxScrollLeft - currentScrollLeft > 1,
    })
  }

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    updateScrollState()
    const observer = new ResizeObserver(updateScrollState)
    observer.observe(track)
    window.addEventListener("resize", updateScrollState)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateScrollState)
    }
  }, [mainCategories.length, isLoading])

  const scrollToCategory = (direction: "previous" | "next") => {
    const track = trackRef.current
    if (!track) return
    const maxScrollLeft = Math.max(0, track.scrollWidth - track.clientWidth)
    const nextIndex = Math.max(0, Math.min(mainCategories.length - 1, activeIndex + (direction === "next" ? 1 : -1)))
    const child = track.children.item(nextIndex) as HTMLElement | null
    if (!child) return
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    track.scrollTo({
      left: Math.min(maxScrollLeft, Math.max(0, child.offsetLeft)),
      behavior: reduceMotion ? "auto" : "smooth",
    })
    setActiveIndex(nextIndex)
    updateScrollState()
  }

  const syncActiveIndex = () => {
    const track = trackRef.current
    if (!track || track.children.length === 0) return
    let nearestIndex = 0
    let nearestDistance = Number.POSITIVE_INFINITY
    Array.from(track.children).forEach((child, index) => {
      const distance = Math.abs((child as HTMLElement).offsetLeft - track.scrollLeft)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestIndex = index
      }
    })
    setActiveIndex(nearestIndex)
    updateScrollState()
  }

  const showEmptyState = !isLoading && !categoriesQuery.isError && mainCategories.length === 0

  return (
    <section className="bg-[var(--color-background)] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="mb-2 text-2xl font-bold text-[var(--color-navy)] md:text-3xl">Categorias em Destaque</h2>
            <p className="text-sm text-[var(--color-text-muted)] md:text-base">Navegue pelas principais linhas de produtos</p>
          </div>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <Link
              to={"/$countryCode/categories" as string}
              params={{ countryCode }}
              className="text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              Ver todas as categorias
            </Link>
            <div className="flex items-center gap-1" aria-label="Navegação das categorias">
              <button
                type="button"
                data-testid="featured-category-previous"
                aria-label="Categoria anterior"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!scrollState.canPrevious}
                onClick={() => scrollToCategory("previous")}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                data-testid="featured-category-next"
                aria-label="Próxima categoria"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-white text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!scrollState.canNext}
                onClick={() => scrollToCategory("next")}
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </header>

        <div
          className="relative"
          role="region"
          aria-label="Categorias em destaque"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              event.preventDefault()
              scrollToCategory("next")
            }
            if (event.key === "ArrowLeft") {
              event.preventDefault()
              scrollToCategory("previous")
            }
          }}
        >
          <div ref={trackRef} onScroll={syncActiveIndex} className="flex gap-5 overflow-x-auto overscroll-x-contain px-1 pb-2 scroll-smooth snap-x snap-mandatory scrollbar-hide focus:outline-none">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex w-[136px] flex-shrink-0 snap-start flex-col items-center p-3 text-center md:w-[148px]">
                  <div className="mb-3 h-[76px] w-[104px] rounded-md bg-gray-200" />
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                </div>
              ))
            ) : categoriesQuery.isError ? (
              <div className="w-full py-8 text-center">
                <p className="mb-4 text-[var(--color-text-muted)]">Não foi possível carregar as categorias agora.</p>
                <button type="button" onClick={() => categoriesQuery.refetch()} className="rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-2 font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)]">
                  Tentar novamente
                </button>
              </div>
            ) : showEmptyState ? (
              <div className="w-full py-8 text-center text-[var(--color-text-muted)]">Nenhuma categoria encontrada no momento.</div>
            ) : (
              mainCategories.map((category) => (
                <Link
                  key={category.id}
                  to={"/$countryCode/categories/$handle" as string}
                  params={{ countryCode, handle: category.handle }}
                  data-testid="featured-category-item"
                  className="group flex min-h-[136px] w-[136px] flex-shrink-0 snap-start flex-col items-center justify-start p-2 text-center transition-transform duration-[var(--motion-duration-card)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] md:w-[148px]"
                >
                  <CategoryIllustration handle={category.handle} name={category.name} />
                  <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-tight text-[var(--color-navy)]">{category.name}</h3>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 text-center sm:hidden">
          <Link
            to={"/$countryCode/categories" as string}
            params={{ countryCode }}
            className="inline-flex w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--color-surface-soft)] py-3 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Ver todas as categorias
          </Link>
        </div>
      </div>
    </section>
  )
}
