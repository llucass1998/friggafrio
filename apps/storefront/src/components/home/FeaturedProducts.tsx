import { Link, useParams } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { listProducts } from "@/lib/data/products"
import { queryKeys } from "@/lib/utils/query-keys"
import { getRegion } from "@/lib/data/regions"
import { PublicProductCard } from "../public-product-card"
import { useHydrated } from "@/lib/hooks/use-hydrated"

export function FeaturedProducts() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const hydrated = useHydrated()

  // Buscar região do contexto atual
  const { data: region, isError: isRegionError } = useQuery({
    queryKey: ["region", countryCode],
    queryFn: () => getRegion({ country_code: countryCode }),
    enabled: hydrated,
    retry: 1,
  })

  // Buscar os últimos produtos publicados que pertencem à região
  const productsQuery = useQuery({
    queryKey: queryKeys.products.latest(4, region?.id || ""),
    queryFn: () =>
      listProducts({
        query_params: {
          limit: 4,
          order: "-created_at",
        },
        region_id: region!.id,
      }),
    enabled: hydrated && !!region?.id,
    retry: 1,
  })

  const isLoading = !hydrated || productsQuery.isPending || (!region && !isRegionError)
  const isError = productsQuery.isError || isRegionError
  const products = productsQuery.data?.response?.products || []
  const showEmptyState = !isLoading && !isError && products.length === 0

  return (
    <section className="py-10 md:py-16 lg:py-24 bg-white relative w-full mb-12 md:mb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full h-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-2">Produtos Especializados FriggaFrio</h2>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">As soluções mais procuradas para o seu projeto</p>
          </div>
          <Link
            to={"/$countryCode" as string}
            params={{ countryCode }}
            className="hidden md:inline-flex text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Ver todos os produtos
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {/* Skeletons para carregamento */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] h-[400px]">
                <div className="aspect-square bg-gray-200" />
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-full" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="mt-auto h-10 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 min-h-[400px] flex flex-col gap-4 items-center justify-center">
            <p className="text-[var(--color-text-muted)]">Não foi possível carregar os produtos agora.</p>
            <button
              onClick={() => productsQuery.refetch()}
              className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-[var(--radius-button)] font-medium hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        ) : showEmptyState ? (
          <div className="text-center py-12 text-[var(--color-text-muted)] min-h-[400px] flex items-center justify-center">
            Nenhum produto especializado encontrado no momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {products.map((product) => (
              <PublicProductCard key={product.id} product={product} isNew />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
