import { Link, useParams } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { listCategories } from "@/lib/data/categories"
import { useHydrated } from "@/lib/hooks/use-hydrated"

export function FeaturedCategories() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const hydrated = useHydrated()

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    enabled: hydrated,
    retry: 1,
  })

  const isLoading = !hydrated || categoriesQuery.isPending
  const isError = categoriesQuery.isError
  const categories = categoriesQuery.data || []

  // Mostrar apenas as categorias principais
  // Filtramos aquelas com "attachments", "forklift-parts", "material-handling", "operator-accessories", "safety-equipment", "warehouse-equipment"
  const ignoredHandles = ['attachments', 'forklift-parts', 'material-handling', 'operator-accessories', 'safety-equipment', 'warehouse-equipment']
  const mainCategories = categories
    .filter(cat => cat.handle && !cat.parent_category_id && !ignoredHandles.includes(cat.handle))
    .slice(0, 10)

  const showEmptyState = !isLoading && !isError && mainCategories.length === 0

  return (
    <section className="py-16 bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-2">Categorias em Destaque</h2>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">Navegue pelas principais linhas de produtos</p>
          </div>
          <Link
            to={"/$countryCode" as string}
            params={{ countryCode }}
            className="hidden md:inline-flex text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Ver todas as categorias
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col items-center text-center p-6 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)]">
                <div className="w-16 h-16 rounded-full bg-gray-200 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            ))
          ) : isError ? (
            <div className="col-span-full text-center py-8">
              <p className="text-[var(--color-text-muted)] mb-4">Não foi possível carregar as categorias agora.</p>
              <button
                onClick={() => categoriesQuery.refetch()}
                className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          ) : showEmptyState ? (
            <div className="col-span-full text-center py-8 text-[var(--color-text-muted)]">
              Nenhuma categoria encontrada no momento.
            </div>
          ) : (
            mainCategories.map((category) => (
              <Link
                key={category.id}
                to={"/$countryCode" as string}
                params={{ countryCode }}
                className="group flex flex-col items-center text-center p-6 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:shadow-md transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
              >
                <div className="w-16 h-16 rounded-full bg-[var(--color-surface-soft)] flex items-center justify-center mb-4 group-hover:bg-[var(--color-primary)] transition-colors overflow-hidden">
                  {category.metadata?.image ? (
                    <img
                      src={String(category.metadata.image)}
                      alt={category.name}
                      className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <span className="text-2xl text-[var(--color-primary)] group-hover:text-white font-bold">
                      {category.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--color-navy)] text-sm">{category.name}</h3>
              </Link>
            ))
          )}
        </div>

        <div className="mt-6 text-center md:hidden">
          <Link
            to={"/$countryCode" as string}
            params={{ countryCode }}
            className="inline-flex items-center justify-center w-full py-3 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-surface-soft)] rounded-[var(--radius-button)] hover:bg-[var(--color-border)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Ver todas as categorias
          </Link>
        </div>
      </div>
    </section>
  )
}
