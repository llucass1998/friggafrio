import { GET } from "./route"

const response = () => {
  const result: { body?: unknown; json: jest.Mock } = {
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

describe("store home product selection", () => {
  const originalLocation = process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID

  afterEach(() => {
    if (originalLocation === undefined) delete process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID
    else process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID = originalLocation
  })

  it("uses only eligible inventory and identifies the non-ranking fallback", async () => {
    process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID = "loc_1"
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [{ id: "loc_1", name: "FriggaFrio - Loja 1 / Matriz" }] })
      .mockResolvedValueOnce({ data: [{
        id: "prod_1",
        status: "published",
        metadata: { omie_external_id: "001", purchase_enabled: true, omie_unit: "UN" },
        categories: [{ handle: "componentes" }],
        variants: [{ id: "variant_1", sku: "SKU-001", inventory_items: [{ inventory_item_id: "item_1" }] }],
      }] })
      .mockResolvedValueOnce({ data: [{ inventory_item_id: "item_1", location_id: "loc_1", stocked_quantity: 2, reserved_quantity: 0 }] })
    const res = response()

    await GET({ scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toMatchObject({
      source: "featured-inventory-fallback",
      products: [{ id: "prod_1" }],
      ranking_status: "AWAITING_OMIE_SALES_ADAPTER",
    })
  })

  it("excludes product ids already reserved by original Home shelves", async () => {
    process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID = "loc_1"
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [{ id: "loc_1", name: "FriggaFrio - Loja 1 / Matriz" }] })
      .mockResolvedValueOnce({ data: [{
        id: "prod_1",
        status: "published",
        metadata: { omie_external_id: "001", purchase_enabled: true, omie_unit: "UN" },
        categories: [{ handle: "componentes" }],
        variants: [{ id: "variant_1", sku: "SKU-001", inventory_items: [{ inventory_item_id: "item_1" }] }],
      }] })
      .mockResolvedValueOnce({ data: [{ inventory_item_id: "item_1", location_id: "loc_1", stocked_quantity: 2, reserved_quantity: 0 }] })
    const res = response()

    await GET({ query: { exclude_ids: "prod_1" }, scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toMatchObject({ products: [] })
  })
})
