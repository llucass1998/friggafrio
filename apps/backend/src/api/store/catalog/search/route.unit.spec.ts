import { GET } from "./route"

const response = () => {
  const result: { body?: unknown; statusCode?: number; json: jest.Mock; status: jest.Mock } = {
    json: jest.fn((body: unknown) => { result.body = body; return result }),
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
  }
  return result
}

describe("store catalog search", () => {
  it("filters availability before pagination using Medusa availability rules", async () => {
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [
        { id: "p_physical", title: "Physical", created_at: "2026-01-03", variants: [{ manage_inventory: true, inventory_quantity: 4, allow_backorder: false, prices: [{ amount: 10, currency_code: "brl" }] }] },
        { id: "p_backorder", title: "Backorder", created_at: "2026-01-02", variants: [{ manage_inventory: true, inventory_quantity: 0, allow_backorder: true, prices: [{ amount: 20, currency_code: "brl" }] }] },
        { id: "p_unmanaged", title: "Unmanaged", created_at: "2026-01-01", variants: [{ manage_inventory: false, inventory_quantity: null, allow_backorder: false, prices: [{ amount: 30, currency_code: "brl" }] }] },
        { id: "p_empty", title: "Empty", created_at: "2025-12-31", variants: [{ manage_inventory: true, inventory_quantity: 0, allow_backorder: false, prices: [{ amount: 40, currency_code: "brl" }] }] },
      ] })
      .mockResolvedValueOnce({ data: [{ id: "reg_br", currency_code: "brl" }] })
    const res = response()

    await GET({
      query: { region_id: "reg_br", availability: "in_stock", limit: "2", offset: "0" },
      scope: { resolve: () => ({ graph }) },
    } as never, res as never)

    expect(res.statusCode).toBeUndefined()
    expect(res.body).toEqual({ product_ids: ["p_physical", "p_backorder"], count: 3 })
  })

  it("filters stock with Medusa v2 inventory_items linked to inventory_level", async () => {
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [
        {
          id: "p_with_item_stock",
          title: "Product with Inventory Item",
          created_at: "2026-01-03",
          variants: [{
            manage_inventory: true,
            allow_backorder: false,
            inventory_items: [{ inventory_item_id: "inv_item_1" }],
            prices: [{ amount: 100, currency_code: "brl" }],
          }],
        },
        {
          id: "p_with_item_empty",
          title: "Product without stock",
          created_at: "2026-01-02",
          variants: [{
            manage_inventory: true,
            allow_backorder: false,
            inventory_items: [{ inventory_item_id: "inv_item_2" }],
            prices: [{ amount: 100, currency_code: "brl" }],
          }],
        },
      ] })
      .mockResolvedValueOnce({ data: [{ id: "reg_br", currency_code: "brl" }] })
      .mockResolvedValueOnce({ data: [
        { inventory_item_id: "inv_item_1", stocked_quantity: 5, reserved_quantity: 1 },
        { inventory_item_id: "inv_item_2", stocked_quantity: 2, reserved_quantity: 2 },
      ] })
    const res = response()

    await GET({
      query: { region_id: "reg_br", availability: "in_stock", limit: "10", offset: "0" },
      scope: { resolve: () => ({ graph }) },
    } as never, res as never)

    expect(res.statusCode).toBeUndefined()
    expect(res.body).toEqual({ product_ids: ["p_with_item_stock"], count: 1 })
  })

  it("filters by brand, price range and sorts by price_asc", async () => {
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [
        {
          id: "p_cheap",
          title: "Valvula Elgin",
          collection: { id: "col_elgin", title: "Elgin" },
          created_at: "2026-01-01",
          variants: [{ prices: [{ amount: 50, currency_code: "brl" }] }],
        },
        {
          id: "p_expensive",
          title: "Compressor Elgin",
          collection: { id: "col_elgin", title: "Elgin" },
          created_at: "2026-01-02",
          variants: [{ prices: [{ amount: 500, currency_code: "brl" }] }],
        },
        {
          id: "p_other_brand",
          title: "Valvula Danfoss",
          collection: { id: "col_danfoss", title: "Danfoss" },
          created_at: "2026-01-03",
          variants: [{ prices: [{ amount: 80, currency_code: "brl" }] }],
        },
      ] })
      .mockResolvedValueOnce({ data: [{ id: "reg_br", currency_code: "brl" }] })
    const res = response()

    await GET({
      query: { region_id: "reg_br", brand: "col_elgin", price_min: "40", price_max: "100", sort: "price_asc" },
      scope: { resolve: () => ({ graph }) },
    } as never, res as never)

    expect(res.statusCode).toBeUndefined()
    expect(res.body).toEqual({ product_ids: ["p_cheap"], count: 1 })
  })

  it("does not turn an empty option value into a filter", async () => {
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [{ id: "p1", title: "Product", variants: [{ manage_inventory: true, inventory_quantity: 1, prices: [{ amount: 10, currency_code: "brl" }] }] }] })
      .mockResolvedValueOnce({ data: [{ id: "reg_br", currency_code: "brl" }] })
    const res = response()

    await GET({
      query: { region_id: "reg_br", option_value_id: "", limit: "10", offset: "0" },
      scope: { resolve: () => ({ graph }) },
    } as never, res as never)

    expect(res.body).toEqual({ product_ids: ["p1"], count: 1 })
  })
})
