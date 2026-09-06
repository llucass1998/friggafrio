import type { HttpTypes } from "@medusajs/types"
import { getProductPurchaseState } from "@/lib/utils/product-state"

export type HomeProductSelection = "specialized" | "best_sellers" | "maintenance"

const MAINTENANCE_CATEGORY_HANDLES = new Set([
  "bombas-de-vacuo",
  "componentes",
  "conexoes",
  "detectores-de-vazamento",
  "ferramentas-manuais",
  "isolamento-termico",
  "manifolds-e-manometros",
  "oleos",
  "produtos-quimicos",
  "recolhedoras",
  "tubos-de-cobre",
])

// This is merchandising order, not a sales ranking. It keeps the storefront
// deterministic until order-derived analytics are available from the backend.
const MERCHANDISING_CATEGORY_ORDER = [
  "compressores",
  "bombas-de-vacuo",
  "recolhedoras",
  "manifolds-e-manometros",
  "detectores-de-vazamento",
  "ferramentas-manuais",
  "componentes",
  "conexoes",
  "tubos-de-cobre",
  "gases-refrigerantes",
  "outros",
]

const categoryRank = new Map(MERCHANDISING_CATEGORY_ORDER.map((handle, index) => [handle, index]))

function getCategoryHandles(product: HttpTypes.StoreProduct): string[] {
  return (product.categories || [])
    .map((category) => category.handle?.trim().toLowerCase())
    .filter((handle): handle is string => Boolean(handle))
}

function getStableProductKey(product: HttpTypes.StoreProduct): string {
  return `${product.title || ""}\u0000${product.handle || product.id}`.toLocaleLowerCase()
}

function getMerchandisingRank(product: HttpTypes.StoreProduct): number {
  const ranks = getCategoryHandles(product)
    .map((handle) => categoryRank.get(handle))
    .filter((rank): rank is number => rank !== undefined)

  return ranks.length > 0 ? Math.min(...ranks) : MERCHANDISING_CATEGORY_ORDER.length
}

function sortDeterministically(products: HttpTypes.StoreProduct[]): HttpTypes.StoreProduct[] {
  return [...products].sort((left, right) => {
    const rankDifference = getMerchandisingRank(left) - getMerchandisingRank(right)
    if (rankDifference !== 0) return rankDifference
    return getStableProductKey(left).localeCompare(getStableProductKey(right), "pt-BR")
  })
}

export function selectHomeProducts(
  products: HttpTypes.StoreProduct[],
  selection: HomeProductSelection,
  options: { limit?: number; excludeIds?: ReadonlySet<string> } = {},
): HttpTypes.StoreProduct[] {
  // Keep enough real products in the specialized shelf for navigation when
  // the catalog has more than one viewport of cards.
  const limit = options.limit ?? 10
  const excludedIds = options.excludeIds ?? new Set<string>()
  const eligibleProducts = products.filter((product) => !excludedIds.has(product.id))

  // The specialized shelf remains purchase-oriented and fail-closed.
  if (selection === "specialized") {
    return eligibleProducts
      .filter((product) => getProductPurchaseState(product).status === "purchasable")
      .slice(0, limit)
  }

  if (selection === "best_sellers") {
    // Sales-ranked products come from the backend projection. Never substitute
    // merchandising rows for a ranking that has no validated source data.
    return []
  }

  const maintenanceProducts = eligibleProducts.filter((product) =>
    getCategoryHandles(product).some((handle) => MAINTENANCE_CATEGORY_HANDLES.has(handle)) &&
    getProductPurchaseState(product).status === "purchasable",
  )

  // Maintenance is a purchasable shelf; stock and price remain authoritative
  // in the Store API projection consumed by getProductPurchaseState.
  return sortDeterministically(maintenanceProducts).slice(0, limit)
}

export function selectFeaturedInventoryProducts(
  products: HttpTypes.StoreProduct[],
  options: { limit?: number; excludeIds?: ReadonlySet<string> } = {},
): HttpTypes.StoreProduct[] {
  const limit = Math.max(0, Math.min(10, options.limit ?? 10))
  const excludedIds = options.excludeIds ?? new Set<string>()
  return sortDeterministically(products.filter((product) => {
    if (excludedIds.has(product.id)) return false
    const hasImage = Boolean(product.thumbnail || product.images?.some((image) => Boolean(image.url)))
    return hasImage && getProductPurchaseState(product).status === "purchasable"
  })).slice(0, limit)
}
