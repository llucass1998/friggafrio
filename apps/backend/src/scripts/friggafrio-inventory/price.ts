import { NormalizedRow, PricedRow } from "./types"

export function calculateSuggestedSalePrice(cost: number | null): number | null {
  if (cost === null || cost < 0) return null

  // Calculate 30% markup
  const price = cost * 1.30

  // Round to 2 decimal places using standard financial rounding
  return Math.round(price * 100) / 100
}

export function applyPrice(row: NormalizedRow): PricedRow {
  return {
    ...row,
    suggestedPrice: calculateSuggestedSalePrice(row.cost)
  }
}
