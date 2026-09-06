import { aggregateBestSellers, rollingBrazilWindow, type SalesEvent } from "./best-sellers"

const event = (overrides: Partial<SalesEvent>): SalesEvent => ({
  source: "medusa",
  productId: "prod_1",
  quantity: 1,
  soldAt: "2026-08-20T15:00:00.000Z",
  confirmed: true,
  ...overrides,
})

describe("multichannel best sellers", () => {
  const now = new Date("2026-09-03T15:00:00.000Z")
  const eligible = new Set(["prod_1", "prod_2", "prod_3"])

  it("combines online and physical quantities and limits to ten", () => {
    const result = aggregateBestSellers({
      now,
      eligibleProductIds: eligible,
      online: [event({ productId: "prod_1", quantity: 2 })],
      physical: [event({ source: "omie", productId: "prod_1", quantity: 3, externalOrderId: "omie_1" })],
      links: [{ medusaOrderId: "medusa_2", omieOrderId: "omie_1" }],
    })
    expect(result.available).toBe(true)
    expect(result.products[0]).toMatchObject({ productId: "prod_1", quantity: 5 })
  })

  it("deduplicates a physical event linked to the same online order", () => {
    const result = aggregateBestSellers({
      now,
      eligibleProductIds: eligible,
      online: [event({ productId: "prod_1", quantity: 2, orderId: "medusa_1" })],
      physical: [event({ source: "omie", productId: "prod_1", quantity: 2, externalOrderId: "omie_1" })],
      links: [{ medusaOrderId: "medusa_1", omieOrderId: "omie_1" }],
    })
    expect(result.products[0]).toMatchObject({ quantity: 2 })
  })

  it("blocks combined ranking when a physical event lacks a deterministic link", () => {
    const result = aggregateBestSellers({
      now,
      eligibleProductIds: eligible,
      online: [event({})],
      physical: [event({ source: "omie", externalOrderId: null })],
      links: [],
    })
    expect(result).toMatchObject({ available: false, reason: "BEST_SELLERS_DEDUPLICATION_BLOCKED" })
  })

  it("does not let cancelled or out-of-window online rows block an independent physical sale", () => {
    const result = aggregateBestSellers({
      now,
      eligibleProductIds: eligible,
      online: [event({ orderId: "cancelled", cancelled: true })],
      physical: [event({ source: "omie", productId: "prod_2", externalOrderId: null })],
      links: [],
    })
    expect(result).toMatchObject({ available: true })
    expect(result.products[0]).toMatchObject({ productId: "prod_2", quantity: 1 })
  })

  it("subtracts returns and excludes cancelled, test, transfer and out-of-window events", () => {
    const result = aggregateBestSellers({
      now,
      eligibleProductIds: eligible,
      online: [
        event({ quantity: 5, returnedQuantity: 2 }),
        event({ productId: "prod_2", quantity: 9, cancelled: true }),
        event({ productId: "prod_2", quantity: 9, testOrder: true }),
        event({ productId: "prod_2", quantity: 9, transfer: true }),
        event({ productId: "prod_3", quantity: 9, soldAt: "2026-07-01T15:00:00.000Z" }),
      ],
      physical: [],
      links: [],
    })
    expect(result.products).toEqual([expect.objectContaining({ productId: "prod_1", quantity: 3 })])
  })

  it("uses a Brazil-local midnight for the rolling window", () => {
    const window = rollingBrazilWindow(now)
    expect(window.start.toISOString()).toBe("2026-08-04T03:00:00.000Z")
  })

  it("keeps the last valid source unavailable state explicit", () => {
    const result = aggregateBestSellers({ now, eligibleProductIds: eligible, online: [], physical: [], links: [], physicalSourceAvailable: false })
    expect(result).toMatchObject({ available: false, reason: "PHYSICAL_SOURCE_UNAVAILABLE", products: [] })
  })
})
