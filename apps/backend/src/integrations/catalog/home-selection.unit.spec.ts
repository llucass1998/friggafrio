import { selectHomeProductSelection } from "./home-selection"

describe("home product selection", () => {
  const eligible = ["prod_b", "prod_a", "prod_c"]

  it("uses a validated ranking and does not mix fallback products into it", () => {
    expect(selectHomeProductSelection({
      eligibleProductIds: eligible,
      ranking: {
        available: true,
        windowStart: "2026-08-01T00:00:00.000Z",
        windowEnd: "2026-09-01T00:00:00.000Z",
        products: [{ productId: "prod_c", quantity: 9, salesCount: 1, lastSoldAt: "2026-09-01T00:00:00.000Z" }],
      },
    })).toEqual({ source: "sales-ranking-30d", productIds: ["prod_c"] })
  })

  it("uses a stable, limited inventory fallback when ranking data is unavailable or empty", () => {
    expect(selectHomeProductSelection({ eligibleProductIds: eligible, ranking: null, limit: 2 }))
      .toEqual({ source: "featured-inventory-fallback", productIds: ["prod_a", "prod_b"] })
  })

  it("does not invent a fallback when no eligible product exists", () => {
    expect(selectHomeProductSelection({ eligibleProductIds: [], ranking: null }))
      .toEqual({ source: "featured-inventory-fallback", productIds: [] })
  })
})
