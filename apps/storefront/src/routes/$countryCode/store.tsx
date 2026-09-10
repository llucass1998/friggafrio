import { createFileRoute, notFound, useLoaderData, useParams, useRouter } from "@tanstack/react-router"
import { getRegion } from "@/lib/data/regions"
import Store from "@/pages/store"
import { listProducts, searchCatalog } from "@/lib/data/products"
import { retrieveCategory } from "@/lib/data/categories"
import { HttpTypes } from "@medusajs/types"
import { sanitize } from "@/lib/utils/sanitize"
import { z } from "zod"
import { OPTION_VALUE_QUERY_KEY } from "@/lib/utils/option-value-params"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"
import { clampPage, normalizePage, offsetForPage, PRODUCTS_PER_PAGE } from "@/lib/utils/pagination"
import { breadcrumbStructuredData, pageMeta, structuredDataScript } from "@/lib/seo"
import {
  normalizeCatalogFilters,
  normalizeCatalogPriceRange,
  normalizeFilterValues,
  type CatalogSort,
} from "@/lib/utils/catalog-filters"

const storeSearchSchema = z.object({
  category: z.string().optional(),
  q: z.string().trim().optional(),
  sort: z.enum(["relevance", "-id", "id", "title", "-title", "price_asc", "price_desc"]).optional(),
  page: z.preprocess((value) => normalizePage(value), z.number().int().min(1)).optional(),
  // Brand values are collection IDs. Keeping them as a list lets Medusa apply
  // OR semantics within the group while preserving the URL on navigation.
  brand: z.union([z.string(), z.array(z.string())]).optional(),
  availability: z.enum(["in_stock"]).optional(),
  price_min: z.preprocess((v) => (v === undefined || v === null || v === "" ? undefined : String(v)), z.string().optional()).optional(),
  price_max: z.preprocess((v) => (v === undefined || v === null || v === "" ? undefined : String(v)), z.string().optional()).optional(),
  promotion: z.preprocess((v) => (v === true ? "true" : v === undefined || v === null || v === "" ? undefined : String(v)), z.enum(["true", "1"]).optional()).optional(),
  [OPTION_VALUE_QUERY_KEY]: z
    .union([z.string(), z.array(z.string())])
    .optional(),
})

type CatalogLoaderData = {
  catalogError?: string
  countryCode?: string
  region?: HttpTypes.StoreRegion
  products?: HttpTypes.StoreProduct[]
  count?: number
  page?: number
  pageSize?: number
  optionValueIds?: string[]
  category?: string
  categoryId?: string
  q?: string
  brand?: string[]
  availability?: "in_stock"
  price_min?: number
  price_max?: number
  promotion?: boolean
  filters?: ReturnType<typeof normalizeCatalogFilters>
}

export const Route = createFileRoute("/$countryCode/store")({
  validateSearch: storeSearchSchema,
  loaderDeps: ({ search }) => ({
    optionValueIds: search[OPTION_VALUE_QUERY_KEY],
    category: search.category,
    q: search.q,
    sort: search.sort,
    page: search.page,
    brand: search.brand,
    availability: search.availability,
    priceMin: search.price_min,
    priceMax: search.price_max,
    promotion: search.promotion,
  }),
  loader: async ({ params, context, deps }) => {
    const { countryCode } = params
    const { queryClient } = context
    const rawOptionValueIds = deps.optionValueIds
    const category = deps.category
    const requestedPage = deps.page ?? 1
    const q = deps.q
    const sort = deps.sort ?? (q ? "relevance" : "-id")
    const brands = normalizeFilterValues(deps.brand)
    const availability = deps.availability === "in_stock" ? "in_stock" : undefined
    const priceRange = normalizeCatalogPriceRange(deps.priceMin, deps.priceMax)
    const priceMin = priceRange.price_min
    const priceMax = priceRange.price_max
    const promotion = deps.promotion === "true" || deps.promotion === "1" ? true : undefined
    const optionValueIds = normalizeFilterValues(rawOptionValueIds)

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region) {
      throw notFound()
    }

    // Legacy navigation still carries category handles in the store query.
    // Resolve them to canonical Medusa IDs before applying the server filter.
    const categoryId = category
      ? await queryClient.ensureQueryData({
          queryKey: ["category", category],
          queryFn: async () => {
            try {
              return (await retrieveCategory({ handle: category }))?.id ?? category
            } catch {
              // Category controls persist Medusa IDs; older links may use a
              // handle. If handle lookup fails, pass the value through as an
              // ID and let the Store API return no matches for invalid input.
              return category
            }
          },
        })
      : undefined

    const queryParams = {
      limit: PRODUCTS_PER_PAGE,
      offset: offsetForPage(requestedPage, PRODUCTS_PER_PAGE),
      // Medusa's created_at ordering is not a total order: equal timestamps
      // can move rows between offsets and duplicate pagination pages.
      // Medusa's Store API supports title/id/created_at ordering. Price
      // ordering is retained in the URL for the catalog query adapter; it is
      // intentionally not sent as an unsupported relation order.
      ...(sort === "relevance" || sort === "price_asc" || sort === "price_desc"
        ? {}
        : { order: sort }),
      fields: PUBLIC_PRODUCT_CARD_FIELDS,
      ...(q ? { q } : {}),
      ...(optionValueIds.length > 0 ? { option_value_id: optionValueIds } : {}),
      ...(categoryId ? { category_id: [categoryId] } : category ? { category_id: ["__missing_category__"] } : {}),
      ...(brands.length > 0 ? { collection_id: brands } : {}),
    }
    const advancedCatalogQuery = Boolean(q) || brands.length > 0 || availability === "in_stock"
      || priceMin !== undefined || priceMax !== undefined || promotion === true
      || sort === "price_asc" || sort === "price_desc"
    const loadCatalogPage = async (targetPage: number) => {
      if (!advancedCatalogQuery) {
        return listProducts({ queryParams: { ...queryParams, offset: offsetForPage(targetPage, PRODUCTS_PER_PAGE) }, regionId: region.id })
      }
      const advanced = await searchCatalog({
        regionId: region.id,
        limit: PRODUCTS_PER_PAGE,
        offset: offsetForPage(targetPage, PRODUCTS_PER_PAGE),
        filters: {
          q,
          category_id: categoryId,
          brand: brands,
          availability,
          price_min: priceMin,
          price_max: priceMax,
          promotion,
          sort,
          option_value_id: optionValueIds,
        },
      })
      if (!advanced.unavailable) {
        if (advanced.product_ids.length === 0) {
          return { products: [], count: advanced.count ?? 0 }
        }
        const hydrated = await listProducts({
          queryParams: { ...queryParams, id: advanced.product_ids, limit: advanced.product_ids.length, offset: 0 },
          regionId: region.id,
        })
        const byId = new Map(hydrated.products.map((product) => [product.id, product]))
        return {
          products: advanced.product_ids
            .map((id) => byId.get(id))
            .filter((product): product is HttpTypes.StoreProduct => Boolean(product)),
          count: advanced.count,
        }
      }

      // Fallback: If custom search endpoint is unavailable, gracefully fall back
      // to Medusa's standard product list so users can continue browsing and filtering
      const validCollectionIds = brands.filter((b) => b.startsWith("pcol_"))
      const brandKeywords = brands.filter((b) => !b.startsWith("pcol_"))
      const combinedSearch = [q, ...brandKeywords].filter(Boolean).join(" ").trim()

      const safeQueryParams: Record<string, unknown> = {
        limit: PRODUCTS_PER_PAGE,
        offset: offsetForPage(targetPage, PRODUCTS_PER_PAGE),
        fields: PUBLIC_PRODUCT_CARD_FIELDS,
        ...(combinedSearch ? { q: combinedSearch } : {}),
        ...(categoryId ? { category_id: [categoryId] } : category ? { category_id: ["__missing_category__"] } : {}),
        ...(validCollectionIds.length > 0 ? { collection_id: validCollectionIds } : {}),
      }

      const fallbackResult = await listProducts({
        queryParams: safeQueryParams,
        regionId: region.id,
      })
      let filteredProducts = fallbackResult.products ?? []
      if (brands.length > 0) {
        filteredProducts = filteredProducts.filter((p) => {
          const titleLower = (p.title || "").toString().toLowerCase()
          const collectionTitleLower = (p.collection?.title || "").toString().toLowerCase()
          const brandMeta = ((p.metadata as Record<string, unknown> | null)?.brand || "").toString().toLowerCase()
          return brands.some((b) => {
            const bLower = b.toLowerCase()
            return (
              titleLower.includes(bLower) ||
              collectionTitleLower.includes(bLower) ||
              brandMeta.includes(bLower) ||
              p.collection?.id === b
            )
          })
        })
      }
      if (priceMin !== undefined || priceMax !== undefined) {
        filteredProducts = filteredProducts.filter((p) => {
          const prices = (p.variants ?? []).flatMap((v) => v.calculated_price?.calculated_amount ?? []).filter(Number.isFinite)
          if (!prices.length) return true
          const minP = Math.min(...prices)
          if (priceMin !== undefined && minP < priceMin) return false
          if (priceMax !== undefined && minP > priceMax) return false
          return true
        })
      }
      if (availability === "in_stock") {
        filteredProducts = filteredProducts.filter((p) =>
          (p.variants ?? []).some((v) => v.allow_backorder || !v.manage_inventory || (typeof v.inventory_quantity === "number" && v.inventory_quantity > 0))
        )
      }
      return {
        products: filteredProducts,
        count: fallbackResult.count ?? filteredProducts.length,
      }
    }

    const queryKey = (page: number) => ["products", {
      region_id: region.id,
      category: categoryId,
      optionValueIds,
      brands,
      availability,
      priceMin,
      priceMax,
      promotion,
      q,
      sort,
      page,
    }] as const
    let firstPage: { products: HttpTypes.StoreProduct[]; count: number }
    try {
      firstPage = await queryClient.ensureQueryData({
        // Keep every server-side filter in the key so a category navigation
        // cannot reuse the unfiltered catalog snapshot during hydration.
        queryKey: queryKey(requestedPage),
        queryFn: () => loadCatalogPage(requestedPage),
      })
    } catch (error) {
      return sanitize({
        countryCode,
        region,
        products: [],
        count: 0,
        page: requestedPage,
        pageSize: PRODUCTS_PER_PAGE,
        optionValueIds,
        category,
        categoryId,
        q,
        brand: brands,
        availability,
        price_min: priceMin,
        price_max: priceMax,
        promotion,
        catalogError: error instanceof Error ? error.message : "CATALOG_QUERY_UNAVAILABLE",
        filters: normalizeCatalogFilters({
          category,
          q,
          sort: sort as CatalogSort,
          page: requestedPage,
          brand: brands,
          availability,
          price_min: priceMin,
          price_max: priceMax,
          promotion,
          option_value_id: optionValueIds,
        }),
      })
    }

    // A stale/shared link may point past the end of the catalog. Fetch the
    // deterministic last page rather than rendering a confusing empty grid.
    const page = clampPage(requestedPage, firstPage.count, PRODUCTS_PER_PAGE)
    const { products, count } = page === requestedPage
      ? firstPage
      : await queryClient.ensureQueryData({
          queryKey: queryKey(page),
          queryFn: () => loadCatalogPage(page),
        })

    return sanitize({
      countryCode,
      region,
      products: products as HttpTypes.StoreProduct[],
      count,
      page,
      pageSize: PRODUCTS_PER_PAGE,
      optionValueIds,
      category,
      categoryId,
      q,
      brand: brands,
      availability,
      price_min: priceMin,
      price_max: priceMax,
      promotion,
      filters: normalizeCatalogFilters({
        category,
        q,
        sort: sort as CatalogSort,
        page,
        brand: brands,
        availability,
        price_min: priceMin,
        price_max: priceMax,
        promotion,
        option_value_id: optionValueIds,
      }),
    })
  },
  head: ({ loaderData }) => {
    const { region, countryCode, q, category, optionValueIds, page, brand, availability, price_min, price_max, promotion } = loaderData || {}
    const regionName = region?.name || countryCode?.toUpperCase()
    const title = `Catálogo de produtos - ${regionName} | FriggaFrio`
    const description = `Encontre equipamentos e peças de refrigeração da FriggaFrio disponíveis em ${regionName}.`
    const filtered = Boolean(q || category || optionValueIds?.length || brand?.length || availability || price_min !== undefined || price_max !== undefined || promotion || (page && page > 1))
    const metadata = pageMeta({
      title,
      description,
      path: `/${countryCode || "br"}/store`,
      indexable: !filtered,
    })

    return {
      ...metadata,
      scripts: [structuredDataScript(breadcrumbStructuredData([
        { name: "Home", path: `/${countryCode || "br"}` },
        { name: "Catálogo", path: `/${countryCode || "br"}/store` },
      ]))],
    }
  },
  errorComponent: CatalogRouteError,
  component: CatalogRouteComponent,
})

function CatalogRouteComponent() {
  const loaderData = useLoaderData({ strict: false }) as CatalogLoaderData | undefined
  if (loaderData?.catalogError) {
    return <CatalogRouteError error={new Error(loaderData.catalogError)} />
  }
  return <Store />
}

function CatalogRouteError({ error }: { error: Error }) {
  const router = useRouter()
  const { countryCode } = useParams({ strict: false }) as { countryCode?: string }

  return (
    <main className="mx-auto flex min-h-[50vh] w-[calc(100%-32px)] max-w-[1520px] flex-col justify-center py-12 sm:w-[calc(100%-48px)] lg:w-[calc(100%-64px)]" data-testid="catalog-route-error">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-text-muted)]">
        <a href={`/${countryCode || "br"}`} className="underline-offset-2 hover:underline">Início</a>
        <span aria-hidden="true" className="px-2">/</span>
        <span>Catálogo</span>
      </nav>
      <section role="alert" aria-live="assertive" className="rounded-[14px] border border-[#f3c7cd] bg-white p-6 text-center shadow-[0_6px_22px_rgba(13,67,105,0.07)] sm:p-10">
        <h1 className="text-xl font-bold text-[var(--color-navy)] sm:text-2xl">Não foi possível carregar o catálogo</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--color-text-muted)]">A busca de produtos está temporariamente indisponível. Seus filtros foram preservados; tente novamente em instantes.</p>
        <button type="button" onClick={() => void router.invalidate()} className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[10px] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">Tentar novamente</button>
        {import.meta.env.DEV && error?.message && <p className="mx-auto mt-4 max-w-xl break-words text-xs text-[var(--color-text-muted)]">Código técnico: {error.message}</p>}
      </section>
    </main>
  )
}
