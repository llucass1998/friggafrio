import { GET } from "./route"

const response = () => {
  const result: { body?: unknown; statusCode?: number; json: jest.Mock; status: jest.Mock } = {
    json: jest.fn((body: unknown) => { result.body = body; return result }),
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
  }
  return result
}

describe("store catalog facets", () => {
  it("aggregates brands, prices and options from products", async () => {
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [
        {
          id: "p1",
          title: "Compressor Elgin 1HP",
          collection: { id: "col_elgin", title: "Elgin" },
          variants: [
            {
              prices: [{ amount: 450, currency_code: "brl" }],
              options: [
                { id: "opt_val_220", value: "220V", option_id: "opt_volt", option: { id: "opt_volt", title: "Voltagem" } },
              ],
            },
          ],
        },
        {
          id: "p2",
          title: "Válvula Elgin",
          collection: { id: "col_elgin", title: "Elgin" },
          variants: [
            {
              prices: [{ amount: 120, currency_code: "brl" }],
              options: [
                { id: "opt_val_110", value: "110V", option_id: "opt_volt", option: { id: "opt_volt", title: "Voltagem" } },
              ],
            },
          ],
        },
      ] })
      .mockResolvedValueOnce({ data: [{ id: "reg_br", currency_code: "brl" }] })

    const res = response()
    await GET({
      query: { region_id: "reg_br" },
      scope: { resolve: () => ({ graph }) },
    } as never, res as never)

    expect(res.statusCode).toBeUndefined()
    expect(res.body).toEqual({
      brands: [{ id: "col_elgin", name: "Elgin", count: 2 }],
      price: { min: 120, max: 450 },
      promotion_available: false,
      options: [
        {
          id: "opt_volt",
          title: "Voltagem",
          values: [
            { id: "opt_val_110", value: "110V", count: 1 },
            { id: "opt_val_220", value: "220V", count: 1 },
          ],
        },
      ],
    })
  })
})
