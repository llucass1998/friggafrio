import { Link, useLoaderData, useNavigate, useSearch } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { OptionsPicker } from "@/components/options-picker"
import { MagnifyingGlass, Funnel, Spinner, XMark } from "@medusajs/icons"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useCategories } from "@/lib/hooks/use-categories"
import { useProducts } from "@/lib/hooks/use-products"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"

interface StorePageData {
  products: HttpTypes.StoreProduct[]
  count: number
  region: HttpTypes.StoreRegion
  countryCode: string
  optionValueIds?: string[]
}

type StoreSearch = {
  category?: string
  [OPTION_VALUE_QUERY_KEY]?: string | string[]
}

export function StorePage({
  hideOptionsPicker = false,
}: {
  hideOptionsPicker?: boolean
} = {}) {
  const loaderData = useLoaderData({ strict: false }) as StorePageData | undefined
  const { region, countryCode = "br" } = loaderData || {}
  const searchParams = useSearch({ strict: false }) as StoreSearch | undefined
  const navigate = useNavigate()

  const optionValueIds = useMemo<string[]>(() => {
    const raw = searchParams?.[OPTION_VALUE_QUERY_KEY]
    if (!raw) return []
    if (Array.isArray(raw)) {
      return Array.from(new Set(raw.filter(Boolean)))
    }
    return Array.from(
      new Set(
        raw
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean)
      )
    )
  }, [searchParams])

  const updateOptionValueIds = useCallback(
    (next: string[]) => {
      const deduped = Array.from(new Set(next.filter(Boolean)))
      const current = optionValueIds
      const sameLength = current.length === deduped.length
      const sameValues =
        sameLength && current.every((v, i) => v === deduped[i])
      if (sameValues) return
      navigate({
        to: ".",
        search: (prev: StoreSearch | undefined) => {
          const next: StoreSearch = { ...(prev ?? {}) }
          if (deduped.length === 0) {
            delete next[OPTION_VALUE_QUERY_KEY]
          } else {
            next[OPTION_VALUE_QUERY_KEY] = deduped
          }
          // Reset pagination on filter change
          delete (next as unknown as { page?: unknown }).page
          return next
        },
        replace: false,
      })
    },
    [navigate, optionValueIds]
  )

  const [searchInput, setSearchInput] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams?.category ?? null)
  const [sortOrder, setSortOrder] = useState("-created_at")
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Debounce search input for server-side queries
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch categories dynamically
  const { data: categories = [] } = useCategories({
    queryParams: {
      include_ancestors_tree: false,
    },
  })

  // Use infinite query for everyone
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingProducts,
  } = useProducts({
    query_params: {
      limit: 24,
      fields: "*variants.calculated_price,*categories,*images,*variants.options",
      order: sortOrder,
      ...(selectedCategory && { category_id: [selectedCategory] }),
      ...(debouncedSearch && { q: debouncedSearch }),
      ...(optionValueIds.length > 0 && { option_value_id: optionValueIds }),
    },
    region_id: region?.id,
  })

  // Flatten products from all pages
  const allProducts = infiniteData?.pages.flatMap((page) => page.products) ?? []

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  )

  useEffect(() => {
    const element = loadMoreRef.current
    if (!element) return

    const observer = new IntersectionObserver(handleObserver, {
      threshold: 0.1,
      rootMargin: "100px",
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [handleObserver])

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Breadcrumb e Header Simples da Página */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3">
          <Link to={"/$countryCode" as string} params={{ countryCode }} className="hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
            Home
          </Link>
          <span className="text-[var(--color-border)]">/</span>
          <span className="text-[var(--color-text)] font-medium">Produtos</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-2">
              Catálogo de Produtos
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">
              Explore nossa linha completa de equipamentos, gases e componentes.
            </p>
          </div>
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {allProducts.length} resultados encontrados
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 flex flex-col lg:flex-row gap-8">

        {/* Filtros Mobile Overlay */}
        {mobileFiltersOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar de Filtros */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-full max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:shadow-none lg:bg-transparent lg:z-0
          ${mobileFiltersOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="h-full flex flex-col lg:block">
            {/* Cabecalho Filtros Mobile */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] lg:hidden bg-white">
              <h2 className="font-bold text-[var(--color-navy)] text-lg flex items-center gap-2">
                <Funnel className="w-5 h-5" />
                Filtros
              </h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-md focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <XMark className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-0">
              <div className="bg-white lg:border border-[var(--color-border)] rounded-[var(--radius-card)] lg:p-5">
                <h2 className="hidden lg:flex text-base font-bold text-[var(--color-navy)] mb-4 items-center gap-2">
                  <Funnel className="w-4 h-4 text-[var(--color-primary)]" />
                  Filtrar resultados
                </h2>

                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Categorias</h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`text-left text-sm py-1.5 px-2 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                        !selectedCategory
                          ? "bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-semibold"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-background)]"
                      }`}
                    >
                      Todas as categorias
                    </button>
                    {categories.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`text-left text-sm py-1.5 px-2 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                          selectedCategory === category.id
                            ? "bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-semibold"
                            : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-background)]"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {!hideOptionsPicker && (
                  <div className="border-t border-[var(--color-border)] pt-5">
                    <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Especificações</h3>
                    <OptionsPicker
                      selectedValueIds={optionValueIds}
                      onChange={updateOptionValueIds}
                    />
                  </div>
                )}

                {/* Limpar Filtros Mobile */}
                <div className="mt-8 lg:hidden">
                  <button
                    onClick={() => {
                      setSelectedCategory(null)
                      updateOptionValueIds([])
                      setMobileFiltersOpen(false)
                    }}
                    className="w-full py-2.5 bg-white border border-[var(--color-border)] hover:bg-[var(--color-background)] text-[var(--color-text)] text-sm font-semibold rounded-[var(--radius-button-sm)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Listagem Principal */}
        <div className="flex-1 min-w-0 flex flex-col gap-6">

          {/* Search & Sort Bar */}
          <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">

            <div className="flex-1 relative w-full">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-shadow"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="lg:hidden flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-medium rounded-[var(--radius-button)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <Funnel className="w-4 h-4" />
                Filtros
              </button>

              <div className="flex-1 sm:flex-initial min-w-[160px]">
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm font-medium text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer"
                >
                  <option value="-created_at">Mais recentes</option>
                  <option value="created_at">Mais antigos</option>
                  <option value="title">Nome: A-Z</option>
                  <option value="-title">Nome: Z-A</option>
                </select>
              </div>
            </div>

          </div>

          {/* Product Grid */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden animate-pulse">
                  <div className="aspect-square bg-[var(--color-background)]" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-[var(--color-border)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--color-border)] rounded w-1/2" />
                    <div className="h-5 bg-[var(--color-border)] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {allProducts.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    isNew={false} // Depende da lógica de negócio
                  />
                ))}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={loadMoreRef} className="mt-8 flex justify-center">
                {isFetchingNextPage ? (
                  <div className="flex items-center gap-2 text-[var(--color-primary)]">
                    <Spinner className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium">Carregando mais produtos...</span>
                  </div>
                ) : hasNextPage ? (
                  <p className="text-sm text-[var(--color-text-muted)]">Role para carregar mais</p>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">Você chegou ao fim da lista.</p>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-white rounded-[var(--radius-card)] border border-[var(--color-border)]">
              <div className="w-16 h-16 bg-[var(--color-surface-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
                <MagnifyingGlass className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="text-lg font-bold text-[var(--color-navy)] mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
                {searchInput
                  ? `Não encontramos resultados para "${searchInput}". Tente um termo diferente ou limpe os filtros.`
                  : "Nenhum produto está disponível nesta categoria no momento."
                }
              </p>
              {(searchInput || selectedCategory || optionValueIds.length > 0) && (
                <button
                  onClick={() => {
                    setSearchInput("")
                    setDebouncedSearch("")
                    setSelectedCategory(null)
                    updateOptionValueIds([])
                  }}
                  className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-[var(--radius-button)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                >
                  Limpar Busca e Filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StorePage