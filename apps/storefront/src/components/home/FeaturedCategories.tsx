import { useQuery } from "@tanstack/react-query"
import { Link, useParams } from "@tanstack/react-router"
import { listCategories } from "@/lib/data/categories"
import { useHydrated } from "@/lib/hooks/use-hydrated"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

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
  const mainCategories = categories
    .filter((category) => category.handle && !category.parent_category_id)
    .filter((category) => !ignoredHandles.includes(category.handle))
    .filter((category) => category.metadata?.featured === true)
    .filter((category) => category.handle !== "outros" && category.name?.trim().toLowerCase() !== "outros")
    .slice(0, 12)

  const { viewportRef, hasOverflow, scrollPrev, scrollNext } = useInfiniteCarousel()
  const showEmptyState = !isLoading && !categoriesQuery.isError && mainCategories.length === 0

  return (
    <section className="bg-[var(--color-background)] py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <CarouselSectionHeader
          title="Categorias em Destaque"
          description="Navegue pelas principais linhas de produtos"
          hasOverflow={hasOverflow}
          onPrevious={scrollPrev}
          onNext={scrollNext}
          previousLabel="Categoria anterior"
          nextLabel="Próxima categoria"
          action={(
            <Link
              to={"/$countryCode/categories" as string}
              params={{ countryCode }}
              className="hidden text-sm font-semibold text-[var(--color-primary)] transition-colors hover:text-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] sm:inline-flex"
            >
              Ver todas as categorias
            </Link>
          )}
        />

        <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" aria-label="Categorias em destaque">
          <div className="ff-carousel-track" data-carousel-track="true">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex flex-[0_0_136px] flex-col items-center text-center md:flex-[0_0_148px]">
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
                  className="ff-carousel-slide ff-category-slide group flex min-h-[136px] flex-col items-center justify-start text-center transition-transform duration-[var(--motion-duration-card)] hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
                  data-carousel-slide="true"
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
