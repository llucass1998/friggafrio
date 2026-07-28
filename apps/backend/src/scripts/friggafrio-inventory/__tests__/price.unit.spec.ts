import { calculateSuggestedSalePrice, applyPrice } from "../price"
import { NormalizedRow } from "../types"

describe("Price", () => {
  it("calculates 30% markup correctly", () => {
    expect(calculateSuggestedSalePrice(100)).toBe(130)
    expect(calculateSuggestedSalePrice(50)).toBe(65)
    expect(calculateSuggestedSalePrice(10.5)).toBe(13.65)
  })

  it("rounds to two decimal places", () => {
    expect(calculateSuggestedSalePrice(33.33)).toBe(43.33)
    expect(calculateSuggestedSalePrice(100.123)).toBe(130.16)
  })

  it("handles zero and missing costs", () => {
    expect(calculateSuggestedSalePrice(0)).toBe(0)
    expect(calculateSuggestedSalePrice(null)).toBeNull()
  })

  it("handles negative cost", () => {
    expect(calculateSuggestedSalePrice(-10)).toBeNull()
  })
})
