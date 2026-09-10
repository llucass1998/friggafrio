import { Link, useLoaderData, useNavigate, useRouterState, useSearch } from "@tanstack/react-router"
import { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { OptionsPicker } from "@/components/options-picker"
import { MagnifyingGlass, XMark } from "@medusajs/icons"
import { ChevronDown, Tags } from "lucide-react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useCategories } from "@/lib/hooks/use-categories"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"
import { clampPage, paginationItems, PRODUCTS_PER_PAGE, totalPagesFor } from "@/lib/utils/pagination"
import { normalizeCatalogPrice, normalizeCatalogPriceRange, normalizeFilterValues, type CatalogSort } from "@/lib/utils/catalog-filters"
import { getCatalogFacets } from "@/lib/data/products"
import { useQuery } from "@tanstack/react-query"

interface StorePageData {
  products: HttpTypes.StoreProduct[]
  count: number
  region: HttpTypes.StoreRegion
  countryCode: string
  page?: number
  pageSize?: number
  optionValueIds?: string[]
  categoryId?: string | null
}

type StoreSearch = {
  category?: string
  page?: number
  [OPTION_VALUE_QUERY_KEY]?: string | string[]
  q?: string
  sort?: CatalogSort
  brand?: string | string[]
  availability?: "in_stock"
  price_min?: string
  price_max?: string
  promotion?: "true" | "1"
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
  const routerIsNavigating = useRouterState({ select: (state) => state.status === "pending" })
  const [hasHydrated, setHasHydrated] = useState(false)

  // TanStack reports the SSR render as pending; defer this visual-only state
  // until hydration so the server and first client tree stay identical.
  useEffect(() => {
    setHasHydrated(true)
  }, [])

  const isNavigating = hasHydrated && routerIsNavigating

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

  const selectedBrands = useMemo(() => normalizeFilterValues(searchParams?.brand), [searchParams?.brand])
  const [priceMinInput, setPriceMinInput] = useState(searchParams?.price_min ?? "")
  const [priceMaxInput, setPriceMaxInput] = useState(searchParams?.price_max ?? "")
  const [priceError, setPriceError] = useState<string | null>(null)
  const facetsQuery = useQuery({
    queryKey: ["catalog-facets", loaderData?.region?.id, searchParams?.q, loaderData?.categoryId],
    queryFn: () => getCatalogFacets({ regionId: loaderData?.region?.id ?? "", filters: { q: searchParams?.q, category: loaderData?.categoryId ?? undefined } }),
    enabled: Boolean(loaderData?.region?.id),
    staleTime: 60_000,
  })
  const facets = facetsQuery.data

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [pendingCategory, setPendingCategory] = useState<string | null>(searchParams?.category ?? null)
  const [pendingOptionValueIds, setPendingOptionValueIds] = useState<string[]>(optionValueIds)
  const [pendingBrands, setPendingBrands] = useState<string[]>(selectedBrands)
  const [pendingAvailability, setPendingAvailability] = useState(searchParams?.availability === "in_stock")
  const [pendingPriceMin, setPendingPriceMin] = useState(searchParams?.price_min ?? "")
  const [pendingPriceMax, setPendingPriceMax] = useState(searchParams?.price_max ?? "")
  const isPromotionActive = searchParams?.promotion === "true" || searchParams?.promotion === "1"
  const [pendingPromotion, setPendingPromotion] = useState(isPromotionActive)

  const updateOptionValueIds = useCallback(
    (next: string[]) => {
      const deduped = Array.from(new Set(next.filter(Boolean)))
      if (mobileFiltersOpen) {
        setPendingOptionValueIds(deduped)
        return
      }
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
    [mobileFiltersOpen, navigate, optionValueIds]
  )

  const [searchInput, setSearchInput] = useState(searchParams?.q ?? "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams?.category ?? null)
  const sortOrder = searchParams?.sort ?? (searchParams?.q ? "relevance" : "-id")
  const [categoriesOpen, setCategoriesOpen] = useState(true)
  const [showAllCategories, setShowAllCategories] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(true)
  const [brandsOpen, setBrandsOpen] = useState(true)
  const [availabilityOpen, setAvailabilityOpen] = useState(true)
  const [priceOpen, setPriceOpen] = useState(true)
  const [showAllBrands, setShowAllBrands] = useState(false)
  const [brandSearch, setBrandSearch] = useState("")
  const filterTriggerRef = useRef<HTMLButtonElement>(null)
  const filterPanelRef = useRef<HTMLElement>(null)
  const wasMobileFiltersOpen = useRef(false)
  const currentPage = clampPage(searchParams?.page ?? loaderPage, count, pageSize)
  const totalPages = totalPagesFor(count, pageSize)
  const catalogRef = useRef<HTMLDivElement>(null)
  const previousPageRef = useRef(currentPage)
  const visibleCategory = mobileFiltersOpen ? pendingCategory : selectedCategory
  const visibleOptionValueIds = mobileFiltersOpen ? pendingOptionValueIds : optionValueIds
  const visibleBrands = mobileFiltersOpen ? pendingBrands : selectedBrands
  const visibleAvailability = mobileFiltersOpen ? pendingAvailability : searchParams?.availability === "in_stock"
  const visiblePromotion = mobileFiltersOpen ? pendingPromotion : isPromotionActive
  const visiblePriceMin = mobileFiltersOpen ? pendingPriceMin : priceMinInput
  const visiblePriceMax = mobileFiltersOpen ? pendingPriceMax : priceMaxInput

  useEffect(() => {
    setSelectedCategory(searchParams?.category ?? null)
  }, [searchParams?.category])

  useEffect(() => {
    setSearchInput(searchParams?.q ?? "")
  }, [searchParams?.q])

  useEffect(() => {
    setPriceMinInput(searchParams?.price_min ?? "")
    setPriceMaxInput(searchParams?.price_max ?? "")
  }, [searchParams?.price_min, searchParams?.price_max])

  useEffect(() => {
    if (!mobileFiltersOpen) return
    setPendingCategory(selectedCategory)
    setPendingOptionValueIds(optionValueIds)
    setPendingBrands(selectedBrands)
    setPendingAvailability(searchParams?.availability === "in_stock")
    setPendingPriceMin(searchParams?.price_min ?? "")
    setPendingPriceMax(searchParams?.price_max ?? "")
    setPendingPromotion(searchParams?.promotion === "true" || searchParams?.promotion === "1")
  }, [mobileFiltersOpen, optionValueIds, selectedBrands, selectedCategory, searchParams?.availability, searchParams?.price_max, searchParams?.price_min, searchParams?.promotion])


  const applyMobileFilters = useCallback(() => {
    const deduped = Array.from(new Set(pendingOptionValueIds.filter(Boolean)))
    const brands = Array.from(new Set(pendingBrands.filter(Boolean)))
    const rawMin = pendingPriceMin.trim()
    const rawMax = pendingPriceMax.trim()
    const parsedMin = normalizeCatalogPrice(rawMin)
    const parsedMax = normalizeCatalogPrice(rawMax)
    if ((rawMin && parsedMin === undefined) || (rawMax && parsedMax === undefined)) {
      setPriceError("Informe preços válidos para aplicar o filtro.")
      return
    }
    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      setPriceError("O preço mínimo não pode ser maior que o preço máximo.")
      return
    }
    setPriceError(null)
    const range = normalizeCatalogPriceRange(pendingPriceMin, pendingPriceMax)
    setSelectedCategory(pendingCategory)
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => {
        const next: StoreSearch = { ...(prev ?? {}) }
        if (pendingCategory) next.category = pendingCategory
        else delete next.category
        if (deduped.length > 0) next[OPTION_VALUE_QUERY_KEY] = deduped
        else delete next[OPTION_VALUE_QUERY_KEY]
        if (brands.length > 0) next.brand = brands
        else delete next.brand
        if (pendingAvailability) next.availability = "in_stock"
        else delete next.availability
        if (range.price_min === undefined) delete next.price_min
        else next.price_min = String(range.price_min)
        if (range.price_max === undefined) delete next.price_max
        else next.price_max = String(range.price_max)
        if (pendingPromotion) next.promotion = "true"
        else delete next.promotion
        delete next.page
        return next
      },
      replace: false,
    })
    setMobileFiltersOpen(false)
  }, [navigate, pendingAvailability, pendingBrands, pendingCategory, pendingOptionValueIds, pendingPriceMax, pendingPriceMin, pendingPromotion])

  const updateCategory = useCallback(
    (nextCategory: string | null) => {
      if (mobileFiltersOpen) {
        setPendingCategory(nextCategory)
        return
      }
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
    [mobileFiltersOpen, navigate],
  )

  const clearFilters = useCallback(() => {
    setPriceError(null)
    setPendingCategory(null)
    setPendingOptionValueIds([])
    setPendingBrands([])
    setPendingAvailability(false)
    setPendingPriceMin("")
    setPendingPriceMax("")
    setPendingPromotion(false)
    setSelectedCategory(null)
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => {
        const next: StoreSearch = { ...(prev ?? {}) }
        delete next.category
        delete next[OPTION_VALUE_QUERY_KEY]
        delete next.brand
        delete next.availability
        delete next.price_min
        delete next.price_max
        delete next.promotion
        delete next.page
        return next
      },
      replace: false,
    })
    setMobileFiltersOpen(false)
  }, [navigate])

  const clearSearch = useCallback(() => {
    setSearchInput("")
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => ({
        ...(prev ?? {}),
        q: undefined,
        page: undefined,
      }),
      replace: false,
    })
  }, [navigate])

  const updateBrands = useCallback((nextBrands: string[]) => {
    const deduped = Array.from(new Set(nextBrands.filter(Boolean)))
    if (mobileFiltersOpen) {
      setPendingBrands(deduped)
      return
    }
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => {
        const next: StoreSearch = { ...(prev ?? {}) }
        if (deduped.length > 0) next.brand = deduped
        else delete next.brand
        delete next.page
        return next
      },
      replace: false,
    })
  }, [mobileFiltersOpen, navigate])

  const updateAvailability = useCallback((enabled: boolean) => {
    if (mobileFiltersOpen) {
      setPendingAvailability(enabled)
      return
    }
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => ({
        ...(prev ?? {}),
        availability: enabled ? ("in_stock" as const) : undefined,
        page: undefined,
      }),
      replace: false,
    })
  }, [mobileFiltersOpen, navigate])

  const applyPriceRange = useCallback((minimum: string, maximum: string) => {
    const rawMin = minimum.trim()
    const rawMax = maximum.trim()
    const parsedMin = normalizeCatalogPrice(rawMin)
    const parsedMax = normalizeCatalogPrice(rawMax)
    if ((rawMin && parsedMin === undefined) || (rawMax && parsedMax === undefined)) {
      setPriceError("Informe preços válidos para aplicar o filtro.")
      return
    }
    if (parsedMin !== undefined && parsedMax !== undefined && parsedMin > parsedMax) {
      setPriceError("O preço mínimo não pode ser maior que o preço máximo.")
      return
    }
    setPriceError(null)
    const range = normalizeCatalogPriceRange(minimum, maximum)
    if (mobileFiltersOpen) {
      setPendingPriceMin(minimum)
      setPendingPriceMax(maximum)
      return
    }
    navigate({
      to: ".",
      search: (prev: StoreSearch | undefined) => {
        const next: StoreSearch = { ...(prev ?? {}) }
        if (range.price_min === undefined) delete next.price_min
        else next.price_min = String(range.price_min)
        if (range.price_max === undefined) delete next.price_max
        else next.price_max = String(range.price_max)
        delete next.page
        return next
      },
      replace: false,
    })
  }, [mobileFiltersOpen, navigate])

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
        replace: true,
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [navigate, searchInput, searchParams?.q])

  useEffect(() => {
    if (!mobileFiltersOpen) return
    filterPanelRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        setMobileFiltersOpen(false)
        return
      }
      if (event.key !== "Tab") return

      const panel = filterPanelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [mobileFiltersOpen])

  useEffect(() => {
    if (wasMobileFiltersOpen.current && !mobileFiltersOpen) filterTriggerRef.current?.focus()
    wasMobileFiltersOpen.current = mobileFiltersOpen
  }, [mobileFiltersOpen])

  // Keep the page behind the mobile drawer from scrolling while filters are open.
  useEffect(() => {
    if (!mobileFiltersOpen || typeof document === "undefined") return
    const previousOverflow = document.body.style.overflow === "hidden" ? "" : document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileFiltersOpen])

  // Fetch categories dynamically
  const { data: categories = [] } = useCategories({
    queryParams: {
      include_ancestors_tree: false,
    },
  })

  const selectedCategoryName = useMemo(
    () => categories.find((category) => category.id === visibleCategory)?.name ?? visibleCategory,
    [categories, visibleCategory]
  )
  const availableBrands = useMemo(() => {
    const selected = mobileFiltersOpen ? pendingBrands : selectedBrands
    const brands = [...(facets?.brands ?? [])]
    for (const id of selected) {
      if (!brands.some((brand) => brand.id === id)) brands.push({ id, name: id })
    }
    const query = brandSearch.trim().toLocaleLowerCase("pt-BR")
    return brands.filter((brand) => !query || brand.name.toLocaleLowerCase("pt-BR").includes(query))
  }, [brandSearch, facets?.brands, mobileFiltersOpen, pendingBrands, selectedBrands])
  const hasActiveFilters = Boolean(
    searchParams?.q || selectedCategory || optionValueIds.length > 0 || selectedBrands.length > 0
      || searchParams?.availability === "in_stock" || searchParams?.price_min || searchParams?.price_max || isPromotionActive,
  )
  const hasNonSearchFilters = Boolean(
    selectedCategory || optionValueIds.length > 0 || selectedBrands.length > 0
      || searchParams?.availability === "in_stock" || searchParams?.price_min || searchParams?.price_max || isPromotionActive,
  )
  const activeFilterCount = selectedBrands.length + optionValueIds.length
    + (selectedCategory ? 1 : 0)
    + (searchParams?.availability === "in_stock" ? 1 : 0)
    + (searchParams?.price_min || searchParams?.price_max ? 1 : 0)
    + (isPromotionActive ? 1 : 0)

  const pendingFilterCount =
    (pendingCategory ? 1 : 0) +
    pendingBrands.length +
    pendingOptionValueIds.length +
    (pendingAvailability ? 1 : 0) +
    (pendingPriceMin || pendingPriceMax ? 1 : 0) +
    (pendingPromotion ? 1 : 0)

  const hasPendingChanges =
    pendingCategory !== selectedCategory ||
    pendingBrands.join(",") !== selectedBrands.join(",") ||
    pendingAvailability !== (searchParams?.availability === "in_stock") ||
    pendingPriceMin !== (searchParams?.price_min ?? "") ||
    pendingPriceMax !== (searchParams?.price_max ?? "") ||
    pendingPromotion !== isPromotionActive ||
    pendingOptionValueIds.join(",") !== optionValueIds.join(",")

  useEffect(() => {
    if (previousPageRef.current === currentPage) return
    previousPageRef.current = currentPage
    if (!catalogRef.current || typeof window === "undefined") return
    const top = catalogRef.current.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" })
  }, [currentPage])

  // The route loader applies relevance and all other ordering before pagination.
  // Preserve that server-provided order on every page.
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
    <div className="ff-catalog-page min-h-screen bg-[var(--color-background)] pb-10 lg:pb-16">
      {/* Breadcrumb e Header Simples da Página */}
      <div className="mx-auto w-[calc(100%-24px)] max-w-[1520px] py-6 sm:w-[calc(100%-32px)] sm:py-8 lg:w-[calc(100%-64px)]">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-3">
          <Link to={"/$countryCode" as string} params={{ countryCode }} className="hover:text-[var(--color-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
            Home
          </Link>
          <span className="text-[var(--color-border)]">/</span>
          <span className="text-[var(--color-text)] font-medium">Todos os produtos</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--color-navy)] mb-2">
              Todos os produtos
            </h1>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">
              Encontre equipamentos, gases, ferramentas e componentes para refrigeração.
            </p>
          </div>
          <div className="text-sm font-medium text-[var(--color-text-muted)]">
            {count.toLocaleString("pt-BR")} produtos encontrados
          </div>
        </div>
      </div>

      <div data-testid="catalog-layout" className="catalog-layout mx-auto grid w-[calc(100%-24px)] max-w-[1520px] grid-cols-1 items-start gap-5 sm:w-[calc(100%-32px)] lg:w-[calc(100%-64px)] lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-6">

        {/* Filtros Mobile Overlay */}
        {mobileFiltersOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Sidebar de Filtros */}
        <aside
          data-testid="catalog-filter-sidebar"
          aria-label="Filtros do catálogo"
          ref={filterPanelRef}
          tabIndex={-1}
          role={mobileFiltersOpen ? "dialog" : undefined}
          aria-modal={mobileFiltersOpen ? true : undefined}
          aria-labelledby={mobileFiltersOpen ? "mobile-filters-title" : undefined}
          className={`
          fixed inset-y-0 left-0 z-50 h-[100dvh] max-h-[100dvh] w-full max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:sticky lg:top-24 lg:h-auto lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:translate-x-0 lg:w-[250px] lg:shadow-none lg:bg-transparent lg:z-0
          ${mobileFiltersOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none lg:pointer-events-auto"}
        `}>
          <div className="h-full flex flex-col lg:block">
            {/* Cabecalho Filtros Mobile */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] lg:hidden bg-white">
              <h2 id="mobile-filters-title" className="font-bold text-[var(--color-navy)] text-lg flex items-center gap-2">
                <Tags className="w-5 h-5" aria-hidden="true" />
                Filtros
              </h2>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Fechar filtros"
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] rounded-md focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                <XMark className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 lg:p-0">
              <div className="rounded-[14px] border border-[var(--color-border)] bg-white p-5 shadow-[0_6px_22px_rgba(13,67,105,0.07)]">
                <h2 className="hidden lg:flex text-base font-bold text-[var(--color-navy)] mb-4 items-center gap-2">
                  <Tags className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
                  Filtrar resultados
                </h2>

                <div className="mb-5">
                  <button type="button" aria-expanded={categoriesOpen} onClick={() => setCategoriesOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                    Categorias
                    <ChevronDown className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${categoriesOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {categoriesOpen && <div className="flex flex-col gap-2">
                    <button
                      onClick={() => updateCategory(null)}
                      className={`text-left text-sm py-1.5 px-2 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                        !visibleCategory
                          ? "bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-semibold"
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-background)]"
                      }`}
                    >
                      Todas as categorias
                    </button>
                  {categories.slice(0, showAllCategories ? 99 : 6).map(category => (
                      <button
                        key={category.id}
                        onClick={() => updateCategory(visibleCategory === category.id ? null : category.id)}
                        className={`text-left text-sm py-1.5 px-2 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
                          visibleCategory === category.id
                            ? "bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-semibold"
                            : "text-[var(--color-text-muted)] hover:text-[var(--color-navy)] hover:bg-[var(--color-background)]"
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>}
                  {categories.length > 6 && <button type="button" onClick={() => setShowAllCategories((show) => !show)} className="mt-3 min-h-11 text-left text-xs font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">{showAllCategories ? "Ver menos" : "Ver mais"}</button>}
                </div>

                <div className="border-t border-[var(--color-border)] pt-3">
                  <button type="button" aria-expanded={brandsOpen} onClick={() => setBrandsOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-[var(--color-text)]">
                    Marca
                    <ChevronDown className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${brandsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {brandsOpen && <>
                  <input type="search" value={brandSearch} onChange={(event) => setBrandSearch(event.target.value)} placeholder="Buscar marca..." aria-label="Buscar marca" className="mt-1 min-h-11 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]" />
                  {facetsQuery.isLoading ? (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">Carregando marcas...</p>
                  ) : availableBrands.length ? (
                    <div className="mt-2 flex max-h-40 flex-col gap-2 overflow-y-auto">
                      {availableBrands.slice(0, showAllBrands ? 100 : 8).map((brand) => {
                        const checked = visibleBrands.includes(brand.id)
                        return (
                          <label key={brand.id} className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-text-muted)]">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => updateBrands(checked
                                ? visibleBrands.filter((id) => id !== brand.id)
                                : [...visibleBrands, brand.id])}
                              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                            />
                            <span>{brand.name}</span>
                          </label>
                        )
                      })}
                      {availableBrands.length > 8 && (
                        <button type="button" onClick={() => setShowAllBrands((show) => !show)} className="min-h-11 text-left text-xs font-semibold text-[var(--color-primary)]">
                          {showAllBrands ? "Ver menos" : "Ver mais"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">Nenhuma marca disponível</p>
                  )}
                  </>}
                </div>

                <div className="border-t border-[var(--color-border)] pt-3">
                  <button type="button" aria-expanded={availabilityOpen} onClick={() => setAvailabilityOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-[var(--color-text)]">
                    Disponibilidade
                    <ChevronDown className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${availabilityOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {availabilityOpen && <label className="mt-1 flex min-h-11 items-center gap-2 text-sm text-[var(--color-text-muted)]">
                    <input
                      type="checkbox"
                      checked={visibleAvailability}
                      onChange={(event) => updateAvailability(event.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                    />
                    Somente em estoque
                  </label>}
                </div>

                {facets?.promotion_available && (
                  <div className="border-t border-[var(--color-border)] pt-3">
                    <label className="flex min-h-11 items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <input
                        type="checkbox"
                        checked={visiblePromotion}
                        onChange={(event) => {
                          if (mobileFiltersOpen) setPendingPromotion(event.target.checked)
                          else navigate({
                            to: ".",
                            search: (prev: StoreSearch | undefined) => ({
                              ...(prev ?? {}),
                              promotion: event.target.checked ? ("true" as const) : undefined,
                              page: undefined,
                            }),
                            replace: false,
                          })
                        }}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)]"
                      />
                      Em promoção
                    </label>
                  </div>
                )}

                <div className="border-t border-[var(--color-border)] pt-3">
                  <button type="button" aria-expanded={priceOpen} onClick={() => setPriceOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between text-left text-sm font-semibold text-[var(--color-text)]">
                    Faixa de preço
                    <ChevronDown className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${priceOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {priceOpen && <div className="mt-2 grid grid-cols-2 gap-2">
                    <input
                      inputMode="decimal"
                      aria-label="Preço mínimo"
                      placeholder="Mínimo"
                      value={visiblePriceMin}
                      onChange={(event) => {
                        setPriceError(null)
                        if (mobileFiltersOpen) setPendingPriceMin(event.target.value)
                        else setPriceMinInput(event.target.value)
                      }}
                      onBlur={() => !mobileFiltersOpen && applyPriceRange(priceMinInput, priceMaxInput)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          applyPriceRange(mobileFiltersOpen ? visiblePriceMin : priceMinInput, mobileFiltersOpen ? visiblePriceMax : priceMaxInput)
                        }
                      }}
                      className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-2 text-sm"
                    />
                    <input
                      inputMode="decimal"
                      aria-label="Preço máximo"
                      placeholder="Máximo"
                      value={visiblePriceMax}
                      onChange={(event) => {
                        setPriceError(null)
                        if (mobileFiltersOpen) setPendingPriceMax(event.target.value)
                        else setPriceMaxInput(event.target.value)
                      }}
                      onBlur={() => !mobileFiltersOpen && applyPriceRange(priceMinInput, priceMaxInput)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          applyPriceRange(mobileFiltersOpen ? visiblePriceMin : priceMinInput, mobileFiltersOpen ? visiblePriceMax : priceMaxInput)
                        }
                      }}
                      className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-2 text-sm"
                    />
                  </div>}
                  {facets?.price?.min !== undefined && facets?.price?.max !== undefined && (
                    <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
                      De {facets.price.min.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} a {facets.price.max.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  )}
                  {priceError && <p role="alert" className="mt-2 text-xs font-medium text-[var(--color-danger)]">{priceError}</p>}
                </div>

                {!hideOptionsPicker && visibleCategory && (facets?.options?.length ?? 0) > 0 && (
                  <div className="border-t border-[var(--color-border)] pt-3">
                    <button type="button" aria-expanded={optionsOpen} onClick={() => setOptionsOpen((open) => !open)} className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm font-semibold text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
                      Filtros técnicos
                      <ChevronDown className={`h-4 w-4 text-[var(--color-text-muted)] transition-transform ${optionsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                    </button>
                    {optionsOpen && <OptionsPicker
                      selectedValueIds={visibleOptionValueIds}
                      onChange={updateOptionValueIds}
                      optionsOverride={facets?.options}
                    />}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé Fixo Filtros Mobile */}
            <div className="border-t border-[var(--color-border)] bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] lg:hidden">
              <button
                type="button"
                data-testid="apply-mobile-filters"
                onClick={applyMobileFilters}
                className="w-full rounded-[var(--radius-button-sm)] bg-[var(--color-primary)] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] shadow-sm"
              >
                {hasPendingChanges ? (
                  <>Aplicar filtros{pendingFilterCount > 0 ? ` (${pendingFilterCount})` : ""}</>
                ) : (
                  <>Ver {count} {count === 1 ? "produto" : "produtos"}</>
                )}
              </button>
              <button
                type="button"
                data-testid="clear-mobile-filters"
                onClick={clearFilters}
                className="mt-2 w-full py-2 bg-transparent text-[var(--color-text-muted)] hover:text-[var(--color-navy)] text-xs font-semibold rounded-[var(--radius-button-sm)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                Limpar todos os filtros
              </button>
            </div>
          </div>
        </aside>

        {/* Listagem Principal */}
        <div ref={catalogRef} data-testid="catalog-main" className="catalog-main flex min-w-0 flex-col gap-4">

          {/* Search & Sort Bar */}
          <div data-testid="catalog-toolbar" className="catalog-toolbar scroll-mt-24 grid min-h-[62px] grid-cols-1 gap-3 rounded-[14px] border border-[var(--color-border)] bg-white p-2.5 shadow-[0_6px_22px_rgba(13,67,105,0.07)] lg:grid-cols-[minmax(0,1fr)_180px]">

            <div className="flex-1 relative w-full">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-11 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-shadow"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  aria-label="Limpar pesquisa"
                  className="absolute right-2 top-1/2 flex min-h-10 min-w-10 -translate-y-1/2 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                >
                  <XMark className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:contents">
              <button
                ref={filterTriggerRef}
                type="button"
                data-testid="mobile-filter-trigger"
                onClick={() => {
                  setPendingCategory(selectedCategory)
                  setPendingOptionValueIds(optionValueIds)
                  setPendingBrands(selectedBrands)
                  setPendingAvailability(searchParams?.availability === "in_stock")
                  setPendingPriceMin(searchParams?.price_min ?? "")
                  setPendingPriceMax(searchParams?.price_max ?? "")
                  setPendingPromotion(isPromotionActive)
                  setMobileFiltersOpen(true)
                }}
                className="lg:hidden flex w-full items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-surface-soft)] text-[var(--color-primary)] font-medium rounded-[var(--radius-button)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] sm:flex-1"
              >
                <Tags className="w-4 h-4" aria-hidden="true" />
                Filtros{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>

              <div className="w-full sm:w-auto sm:min-w-[160px]">
                <select
                  value={sortOrder}
                  onChange={(e) => updateSort(e.target.value as StoreSearch["sort"])}
                  className="w-full px-4 py-2.5 bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm font-medium text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent cursor-pointer"
                >
                  <option value="relevance">Mais relevantes</option>
                  <option value="-id">Mais recentes</option>
                  <option value="id">Mais antigos</option>
                  <option value="title">Nome: A-Z</option>
                  <option value="-title">Nome: Z-A</option>
                  <option value="price_asc">Menor preço</option>
                  <option value="price_desc">Maior preço</option>
                </select>
              </div>
            </div>

          </div>

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 px-1" aria-label="Filtros ativos">
              {searchParams?.q && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  aria-label={`Remover busca ${searchParams.q}`}
                >
                  Busca: {searchParams.q} <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {selectedCategory && (
                <button
                  type="button"
                  onClick={() => updateCategory(null)}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  aria-label={`Remover categoria ${selectedCategoryName}`}
                >
                  {selectedCategoryName} <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {optionValueIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => updateOptionValueIds([])}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  aria-label="Remover especificações selecionadas"
                >
                  {optionValueIds.length} {optionValueIds.length === 1 ? "especificação" : "especificações"} <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {selectedBrands.map((brandId) => {
                const label = facets?.brands?.find((brand) => brand.id === brandId)?.name ?? brandId
                return (
                  <button
                    key={brandId}
                    type="button"
                    onClick={() => updateBrands(selectedBrands.filter((id) => id !== brandId))}
                    className="inline-flex min-h-8 items-center gap-1 rounded-full border border-transparent bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)] hover:border-[var(--color-primary)]"
                  >
                    {label} <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )
              })}
              {searchParams?.availability === "in_stock" && (
                <button type="button" onClick={() => updateAvailability(false)} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)]">
                  Em estoque <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {(searchParams?.price_min || searchParams?.price_max) && (
                <button type="button" onClick={() => applyPriceRange("", "")} className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)]">
                  Preço {searchParams.price_min ? `a partir de ${searchParams.price_min}` : ""}{searchParams.price_max ? ` até ${searchParams.price_max}` : ""} <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {isPromotionActive && (
                <button
                  type="button"
                  onClick={() => navigate({ to: ".", search: (prev: StoreSearch | undefined) => ({ ...(prev ?? {}), promotion: undefined, page: undefined }), replace: false })}
                  className="inline-flex min-h-8 items-center gap-1 rounded-full bg-[#dfefff] px-3 text-xs font-semibold text-[var(--color-primary)]"
                >
                  Em promoção <XMark className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={clearFilters}
                className="min-h-8 px-1 text-xs font-semibold text-[var(--color-primary)] underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                Limpar tudo
              </button>
            </div>
          )}

          {/* Product Grid */}
          {isNavigating ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 min-[1280px]:grid-cols-4 2xl:gap-6">
              {Array.from({ length: pageSize }).map((_, i) => (
                <div key={i} className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-[var(--color-background)]" />
                  <div className="p-3 sm:p-4 space-y-3">
                    <div className="h-4 bg-[var(--color-border)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--color-border)] rounded w-1/2" />
                    <div className="h-5 bg-[var(--color-border)] rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts.length > 0 ? (
            <>
              <div data-testid="store-product-grid" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 min-[1280px]:grid-cols-4 2xl:gap-6">
                {allProducts.map((product) => (
                  <PublicProductCard
                    key={product.id}
                    product={product}
                    catalog
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <nav aria-label="Paginação do catálogo" className="mt-2 flex flex-col items-center gap-3 sm:mt-4 sm:flex-row sm:justify-center" data-testid="catalog-pagination">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1 || isNavigating} aria-label="Página anterior" className="min-h-10 min-w-10 rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40">‹</button>
                    <div className="hidden items-center gap-1 sm:flex">
                      {paginationItems(currentPage, totalPages).map((item, index) => item === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-2 text-sm text-[var(--color-text-muted)]" aria-hidden="true">…</span>
                      ) : (
                        <button key={item} type="button" onClick={() => goToPage(item)} aria-current={item === currentPage ? "page" : undefined} aria-label={`Página ${item}`} disabled={isNavigating} className={`min-h-10 min-w-10 rounded-[var(--radius-button-sm)] border px-3 py-2 text-sm font-semibold transition-colors ${item === currentPage ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" : "border-[var(--color-border)] bg-white text-[var(--color-navy)] hover:border-[var(--color-primary)]"}`}>{item}</button>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-[var(--color-text-muted)] sm:hidden">Página {currentPage} de {totalPages}</span>
                    <button type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= totalPages || isNavigating} aria-label="Próxima página" className="min-h-10 min-w-10 rounded-[var(--radius-button-sm)] border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40">›</button>
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
              {hasActiveFilters && (
                <button
                  onClick={hasNonSearchFilters ? clearFilters : clearSearch}
                  className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-sm font-semibold rounded-[var(--radius-button)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                >
                  {hasNonSearchFilters ? "Limpar filtros" : "Limpar pesquisa"}
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
