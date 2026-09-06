import { GET } from "./route"

const response = () => {
  const result: { body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn(() => result),
    json: jest.fn((body: unknown) => {
      result.body = body
      return result
    }),
  }
  return result
}

describe("store best-sellers projection", () => {
  const originalLocation = process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID

  afterEach(() => {
    if (originalLocation === undefined) delete process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID
    else process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID = originalLocation
  })

  it("fails closed when the authorized Omie stock location is not configured", async () => {
    delete process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID
    const graph = jest.fn().mockResolvedValue({ data: [] })
    const res = response()

    await GET({ scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toEqual({
      available: false,
      reason: "OMIE_STOCK_LOCATION_NOT_CONFIGURED",
      products: [],
    })
  })

  it("does not expose a merchandising fallback when physical sales are unavailable", async () => {
    process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID = "loc_1"
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [{
        id: "prod_1",
        status: "published",
        metadata: { source: "omie", omie_external_id: "100", purchase_enabled: true, omie_unit: "UN" },
        categories: [{ handle: "componentes" }],
        variants: [{ id: "variant_1", sku: "SKU-100", inventory_items: [{ inventory_item_id: "item_1" }] }],
      }] })
      .mockResolvedValueOnce({ data: [{ inventory_item_id: "item_1", location_id: "loc_1", stocked_quantity: 2, reserved_quantity: 0 }] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
    const res = response()

    await GET({ scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toMatchObject({
      available: false,
      reason: "PHYSICAL_SOURCE_UNAVAILABLE",
      products: [],
    })
    expect(res.body).not.toHaveProperty("catalog")
    expect(graph).not.toHaveBeenCalled()
  })
})
