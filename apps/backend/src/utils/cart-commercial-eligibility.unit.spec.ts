import {
  resolveCommercialState,
  validateInventoryQuantity,
  validateCartCommercialEligibility,
} from "./cart-commercial-eligibility"

const sellable = (overrides: Record<string, unknown> = {}) => ({
  quantity: 1,
  unit_price: 10,
  variant: {
    inventory_quantity: 2,
    manage_inventory: true,
    allow_backorder: false,
    product: { metadata: {} },
  },
  ...overrides,
})

describe("cart commercial eligibility", () => {
  it.each([
    ["QUOTE_ONLY", { metadata: { commercial_status: "QUOTE_ONLY" } }],
    ["PRICE_PENDING", { metadata: { price_pending: true } }],
    ["OUT_OF_STOCK", { variant: { inventory_quantity: 0, manage_inventory: true, allow_backorder: false } }],
    ["INVALID", { quantity: 0 }],
  ])("blocks %s lines", (_name, overrides) => {
    expect(resolveCommercialState(sellable(overrides))).not.toMatchObject({ state: "SELLABLE" })
  })

  it("can defer inventory to the locking-backed checkout-ready reservation boundary", () => {
    const result = validateCartCommercialEligibility([
      {
        id: "line_inventory_level",
        quantity: 1,
        unit_price: 3000,
        variant: { manage_inventory: true },
      },
    ], { deferInventoryValidation: true })

    expect(result).toEqual({ eligible: true, checkoutReady: true, blockingLines: [] })
  })

  it("accepts decimal prices serialized as numeric strings", () => {
    expect(resolveCommercialState(sellable({ unit_price: "10.00" } as never))).toMatchObject({
      state: "SELLABLE",
      reason: "SELLABLE",
    })
  })

  it("uses persisted inventory and blocks quantity above stock", () => {
    expect(resolveCommercialState(sellable({ quantity: 3 }))).toMatchObject({
      state: "OUT_OF_STOCK",
      reason: "INSUFFICIENT_INVENTORY",
    })
  })

  it("does not treat missing inventory as available", () => {
    expect(resolveCommercialState(sellable({ variant: { manage_inventory: true, allow_backorder: false } }))).toMatchObject({
      state: "OUT_OF_STOCK",
      reason: "MISSING_INVENTORY",
    })
  })

  it("requires every mixed-cart line to be sellable", () => {
    const result = validateCartCommercialEligibility([
      sellable(),
      sellable({ metadata: { commercial_status: "QUOTE_ONLY" } }),
    ])
    expect(result).toMatchObject({ eligible: false, checkoutReady: false })
    expect(result.blockingLines).toHaveLength(1)
  })

  it("revalidates a stale inventory snapshot server-side", () => {
    const loadedAtT0 = { inventory_quantity: 2, manage_inventory: true, allow_backorder: false }
    expect(validateInventoryQuantity(2, loadedAtT0)).toEqual({ eligible: true })

    const persistedAtT1 = { inventory_quantity: 1, manage_inventory: true, allow_backorder: false }
    expect(validateInventoryQuantity(2, persistedAtT1)).toEqual({
      eligible: false,
      reason: "INSUFFICIENT_INVENTORY",
    })
  })

  it("serializes concurrent eligibility decisions against the latest snapshot", async () => {
    let available = 1
    const request = async () => {
      const result = validateInventoryQuantity(1, {
        inventory_quantity: available,
        manage_inventory: true,
        allow_backorder: false,
      })
      if (result.eligible) available -= 1
      return result
    }

    const results = await Promise.all([request(), request()])
    expect(results.filter((result) => result.eligible)).toHaveLength(1)
    expect(results.filter((result) => !result.eligible)).toHaveLength(1)
  })
})
