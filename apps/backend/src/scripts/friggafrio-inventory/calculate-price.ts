import { MARKUP_MULTIPLIER } from "./config"

/**
 * Calculates the sale price adding the markup and formatting it.
 * Does NOT multiply by 100 or convert to minor units as this is expected to be handled
 * by Medusa's pricing module which expects amounts formatted correctly based on currency.
 */
export function calculateSalePrice(cost: number | null): number | null {
  if (cost === null || cost <= 0) {
    return null
  }

  // Multiply by markup (1.30 = 30%)
  const calculatedPrice = cost * MARKUP_MULTIPLIER

  // Round half-up to 2 decimal places using Number.EPSILON to avoid floating point precision issues
  const roundedPrice = Math.round((calculatedPrice + Number.EPSILON) * 100) / 100

  return roundedPrice
}
