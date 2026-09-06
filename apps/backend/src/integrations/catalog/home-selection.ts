import type { BestSellerResult } from "./best-sellers"

export type HomeProductSelectionSource = "sales-ranking-30d" | "featured-inventory-fallback"

export type HomeProductSelection = {
  source: HomeProductSelectionSource
  productIds: string[]
}

const stableIds = (ids: readonly string[], limit: number): string[] =>
  [...new Set(ids.filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, "pt-BR"))
    .slice(0, limit)

/**
 * Prefer only a validated sales result. The inventory projection is an
 * explicit fallback, never a substitute labelled as a sales ranking.
 */
export const selectHomeProductSelection = ({
  ranking,
  eligibleProductIds,
  limit = 10,
}: {
  ranking: BestSellerResult | null
  eligibleProductIds: readonly string[]
  limit?: number
}): HomeProductSelection => {
  const maximum = Math.max(0, Math.min(10, Math.trunc(limit)))
  const eligible = new Set(eligibleProductIds)
  const ranked = ranking?.available
    ? ranking.products.map((product) => product.productId).filter((id) => eligible.has(id))
    : []

  if (ranked.length > 0) {
    return { source: "sales-ranking-30d", productIds: stableIds(ranked, maximum) }
  }

  return {
    source: "featured-inventory-fallback",
    productIds: stableIds(eligibleProductIds, maximum),
  }
}
