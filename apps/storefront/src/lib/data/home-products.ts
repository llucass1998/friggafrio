import type { HttpTypes } from "@medusajs/types"
import { getProductPurchaseState } from "@/lib/utils/product-state"

export type HomeProductSelection = "specialized" | "best_sellers" | "maintenance"

const BEST_SELLER_CATEGORY_HANDLES = ["gases-refrigerantes", "tubos-de-cobre"] as const

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
  const limit = options.limit ?? (selection === "specialized" ? 4 : 10)
  const excludedIds = options.excludeIds ?? new Set<string>()
  const eligibleProducts = products.filter((product) => !excludedIds.has(product.id))

  // The specialized shelf remains purchase-oriented and fail-closed.
  if (selection === "specialized") {
    return eligibleProducts
      .filter((product) => getProductPurchaseState(product).status === "purchasable")
      .slice(0, limit)
  }

  if (selection === "best_sellers") {
    // No order-derived ranking is available yet. Keep this slot useful and
    // repeatable with real catalog rows from the two priority departments,
    // including out-of-stock rows so merchandising does not hide inventory
    // truth. This is a deterministic merchandising fallback, not a claim of
    // actual sales volume.
    const selectedIds = new Set<string>()
    const selected: HttpTypes.StoreProduct[] = []

    for (const categoryHandle of BEST_SELLER_CATEGORY_HANDLES) {
      const categoryProducts = sortDeterministically(
        eligibleProducts.filter((product) => getCategoryHandles(product).includes(categoryHandle)),
      )

      for (const product of categoryProducts.slice(0, 5)) {
        if (selectedIds.has(product.id)) continue
        selectedIds.add(product.id)
        selected.push(product)
      }
    }

    return selected.slice(0, limit)
  }

  const maintenanceProducts = eligibleProducts.filter((product) =>
    getCategoryHandles(product).some((handle) => MAINTENANCE_CATEGORY_HANDLES.has(handle)),
  )

  // Maintenance is also catalog merchandising: show real rows even when an
  // item is temporarily out of stock, so the card can communicate its state.
  return sortDeterministically(maintenanceProducts).slice(0, limit)
}
