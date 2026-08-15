import { projectStorefrontCommercialState } from "./storefront-commercial-state"

describe("storefront commercial state projection", () => {
  it("turns a positive, priced product into SELLABLE when no quote policy exists", () => {
    expect(projectStorefrontCommercialState({
      metadata: { commercial_status: "QUOTE_ONLY", product_sales_policy: "QUOTE_ONLY", purchase_enabled: false },
      validPrice: true,
      availableQuantity: 4,
    })).toMatchObject({ state: "SELLABLE", metadata: { commercial_status: "SELLABLE", product_sales_policy: "DIRECT", is_quote_only: false, purchase_enabled: true } })
  })

  it("keeps explicit quote policy independent from stock", () => {
    expect(projectStorefrontCommercialState({
      metadata: { purchase_enabled: true },
      policy: { is_quote_only: true, requires_contact: true },
      validPrice: true,
      availableQuantity: 4,
    })).toMatchObject({ state: "QUOTE_ONLY", metadata: { commercial_status: "QUOTE_ONLY", purchase_enabled: false } })
  })

  it("distinguishes zero stock from missing price", () => {
    expect(projectStorefrontCommercialState({ validPrice: true, availableQuantity: 0 }).state).toBe("OUT_OF_STOCK")
    expect(projectStorefrontCommercialState({ validPrice: false, availableQuantity: 5 }).state).toBe("PRICE_PENDING")
  })
})
