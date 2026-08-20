import { Link, useLoaderData, useNavigate, useRouterState, useSearch } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { OptionsPicker } from "@/components/options-picker"
import { MagnifyingGlass, Funnel, XMark } from "@medusajs/icons"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useCategories } from "@/lib/hooks/use-categories"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"
import { clampPage, paginationItems, PRODUCTS_PER_PAGE, totalPagesFor } from "@/lib/utils/pagination"

interface StorePageData {
  products: HttpTypes.StoreProduct[]
  count: number
  region: HttpTypes.StoreRegion
  countryCode: string
  page?: number
  pageSize?: number
  optionValueIds?: string[]
}

type StoreSearch = {
  category?: string
  page?: number
  [OPTION_VALUE_QUERY_KEY]?: string | string[]
  q?: string
  sort?: "-id" | "id" | "title" | "-title"
}

export function StorePage({
  hideOptionsPicker = false,
}: {
  hideOptionsPicker?: boolean
} = {}) {
  const loaderData = useLoaderData({ strict: false }) as StorePageData | undefined
  const {
    countryCode = "br",
    products: loaderProducts = [],
    count = 0,
    page: loaderPage = 1,
    pageSize = PRODUCTS_PER_PAGE,
  } = loaderData || {}
  const searchParams = useSearch({ strict: false }) as StoreSearch | undefined
  const navigate = useNavigate()
  const isNavigating = useRouterState({ select: (state) => state.status === "pending" })

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

  const [searchInput, setSearchInput] = useState(searchParams?.q ?? "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams?.category ?? null)
  const sortOrder = searchParams?.sort ?? "-id"
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const currentPage = clampPage(searchParams?.page ?? loaderPage, count, pageSize)
  const totalPages = totalPagesFor(count, pageSize)
  const catalogRef = useRef<HTMLDivElement>(null)
  const previousPageRef = useRef(currentPage)

  useEffect(() => {
    setSelectedCategory(searchParams?.category ?? null)
  }, [searchParams?.category])

  useEffect(() => {
    setSearchInput(searchParams?.q ?? "")
  }, [searchParams?.q])

  const updateCategory = useCallback(
    (nextCategory: string | null) => {
      setSelectedCategory(nextCategory)
      navigate({
        to: ".",
        search: (prev: StoreSearch | undefined) => {
          const next: StoreSearch = { ...(prev ?? {}) }
          if (nextCategory) next.category = nextCategory
          else delete next.category
          delete next.page
          return next
        },
        replace: false,
      })
    },
    [navigate],
  )

  // Debounce search input into the URL so filtering remains server-side.
  useEffect(() => {
    const timer = setTimeout(() => {
      const nextQuery = searchInput.trim()
      if (nextQuery === (searchParams?.q ?? "")) return
      navigate({
        to: ".",
        search: (prev: StoreSearch | undefined) => {
          const next: StoreSearch = { ...(prev ?? {}) }
          if (nextQuery) next.q = nextQuery
          else delete next.q
          delete next.page
          return next
        },
        replace: false,
      })
    }, 400)
    return () => clearTimeout(timer)
  }, [navigate, searchInput, searchParams?.q])

  // Fetch categories dynamically
  const { data: categories = [] } = useCategories({
    queryParams: {
      include_ancestors_tree: false,
    },
  })

  useEffect(() => {
    if (previousPageRef.current === currentPage) return
    previousPageRef.current = currentPage
    if (!catalogRef.current || typeof window === "undefined") return
    const top = catalogRef.current.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
  }, [currentPage])

  const allProducts = loaderProducts

  const updateSort = (nextSort: StoreSearch["sort"]) => {
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => ({
        ...(prev ?? {}),
        sort: nextSort,
        page: undefined,
      }),
      replace: false,
    })
  }

  const goToPage = useCallback((nextPage: number) => {
    const target = Math.min(Math.max(1, nextPage), totalPages)
    if (target === currentPage) return
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => ({ ...(prev ?? {}), page: target }),
      replace: false,
    })
  }, [currentPage, navigate, totalPages])

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
            {count} resultados encontrados
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
                      onClick={() => updateCategory(null)}
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
                        onClick={() => updateCategory(category.id)}
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
                      updateCategory(null)
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
        <div ref={catalogRef} className="flex-1 min-w-0 flex flex-col gap-6">

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
                  onChange={(e) => updateSort(e.target.value as StoreSearch["sort"])}
                  className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm font-medium text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer"
                >
                  <option value="-id">Mais recentes</option>
                  <option value="id">Mais antigos</option>
                  <option value="title">Nome: A-Z</option>
                  <option value="-title">Nome: Z-A</option>
                </select>
              </div>
            </div>

          </div>

          {/* Product Grid */}
          {isNavigating ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-[var(--color-background)]" />
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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {allProducts.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    isNew={false} // Depende da lógica de negócio
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Paginação do catálogo" className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center" data-testid="catalog-pagination">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1 || isNavigating} aria-label="Página anterior" className="rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40">‹</button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {paginationItems(currentPage, totalPages).map((item, index) => item === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-sm text-[var(--color-text-muted)]" aria-hidden="true">…</span>
                      ) : (
                        <button key={item} type="button" onClick={() => goToPage(item)} aria-current={item === currentPage ? "page" : undefined} aria-label={`Página ${item}`} disabled={isNavigating} className={`min-w-9 rounded-[var(--radius-button-sm)] border px-3 py-2 text-sm font-semibold transition-colors ${item === currentPage ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border)] bg-white text-[var(--color-navy)] hover:border-[var(--color-primary)]"}`}>{item}</button>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-muted)] sm:hidden">Página {currentPage} de {totalPages}</span>
                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages || isNavigating} aria-label="Próxima página" className="rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40">›</button>
                  </div>
                </nav>
              )}
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
                    updateCategory(null)
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
