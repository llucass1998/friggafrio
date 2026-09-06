import { GET } from "./route"

const response = () => {
  const result: { body?: unknown; json: jest.Mock; setHeader: jest.Mock } = {
    json: jest.fn((body: unknown) => { result.body = body; return result }),
    setHeader: jest.fn(),
  }
  return result
}

describe("store promotion campaigns", () => {
  it("projects a dated native campaign without exposing its internal rules", async () => {
    const graph = jest.fn().mockImplementation(async ({ entity }: { entity: string }) => ({ data: entity === "promotion" ? [{
      id: "promo_1",
      status: "active",
      campaign: { id: "camp_1", name: "Semana Frigga", starts_at: "2020-01-01T00:00:00.000Z", ends_at: "2099-01-01T00:00:00.000Z" },
      rules: [{ attribute: "product_id", values: [{ value: "prod_1" }] }],
    }] : [] }))
    const res = response()

    await GET({ scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toMatchObject({
      serverNow: expect.any(String),
      campaigns: [expect.objectContaining({ id: "promo_1", status: "active", productIds: ["prod_1"] })],
    })
    expect(res.body).not.toHaveProperty("rules")
  })

  it("returns active SALE price lists as catalog candidates without leaking rules", async () => {
    const graph = jest.fn().mockImplementation(async ({ entity }: { entity: string }) => {
      if (entity === "promotion") return { data: [] }
      if (entity === "price_list") return { data: [{ id: "plist_new", title: "Sale nova", type: "sale", status: "active", starts_at: "2020-01-01T00:00:00.000Z", ends_at: "2099-01-01T00:00:00.000Z", prices: [{ price_set_id: "ps_1", amount: 882, currency_code: "brl" }] }] }
      if (entity === "product_variant_price_set") return { data: [{ variant_id: "variant_1", price_set_id: "ps_1" }] }
      if (entity === "product_variant") return { data: [{ id: "variant_1", product_id: "prod_new" }] }
      return { data: [] }
    })
    const res = response()

    await GET({ scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toMatchObject({ offers: [{ id: "plist_new", productIds: ["prod_new"], status: "active" }] })
  })

  it("keeps independent active lists and excludes expired lists", async () => {
    const graph = jest.fn().mockImplementation(async ({ entity }: { entity: string }) => {
      if (entity === "promotion") return { data: [] }
      if (entity === "price_list") return {
        data: [
          { id: "plist_a", title: "Sale A", type: "sale", status: "active", starts_at: "2020-01-01T00:00:00.000Z", ends_at: "2099-01-01T00:00:00.000Z", prices: [{ price_set_id: "ps_a" }] },
          { id: "plist_b", title: "Sale B", type: "sale", status: "active", starts_at: "2020-01-01T00:00:00.000Z", ends_at: "2099-01-01T00:00:00.000Z", prices: [{ price_set_id: "ps_b" }] },
          { id: "plist_expired", title: "Sale expirada", type: "sale", status: "active", starts_at: "2020-01-01T00:00:00.000Z", ends_at: "2021-01-01T00:00:00.000Z", prices: [{ price_set_id: "ps_expired" }] },
        ],
      }
      if (entity === "product_variant_price_set") return { data: [
        { variant_id: "variant_a", price_set_id: "ps_a" },
        { variant_id: "variant_b", price_set_id: "ps_b" },
        { variant_id: "variant_expired", price_set_id: "ps_expired" },
      ] }
      if (entity === "product_variant") return { data: [
        { id: "variant_a", product_id: "prod_shared" },
        { id: "variant_b", product_id: "prod_shared" },
        { id: "variant_expired", product_id: "prod_expired" },
      ] }
      return { data: [] }
    })
    const res = response()

    await GET({ scope: { resolve: () => ({ graph }) } } as never, res as never)

    expect(res.body).toMatchObject({
      offers: [
        { id: "plist_a", productIds: ["prod_shared"] },
        { id: "plist_b", productIds: ["prod_shared"] },
      ],
    })
    expect(res.body).not.toEqual(expect.objectContaining({ offers: expect.arrayContaining([expect.objectContaining({ id: "plist_expired" })]) }))
  })
})
