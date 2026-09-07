import { GET } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; headers: Record<string, string>; setHeader: jest.Mock; status: jest.Mock; json: jest.Mock } = {
    headers: {},
    setHeader: jest.fn((name: string, value: string) => { result.headers[name] = value }),
    status: jest.fn((statusCode: number) => { result.statusCode = statusCode; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

const request = (data: unknown[], query: Record<string, unknown>) => ({
  query,
  scope: { resolve: () => ({ graph: jest.fn().mockResolvedValue({ data }) }) },
})

describe("Admin private Omie product links", () => {
  const links = [
    { id: "link_1", code_display: "DPGS2205", code_normalized: "DPGS2205", product_id: "prod_1", variant_id: "variant_1", source: "omie-catalog-read-only" },
    { id: "link_2", code_display: "DPGS1345", code_normalized: "DPGS1345", product_id: "prod_2", variant_id: "variant_2", source: "omie-catalog-read-only" },
  ]

  it("returns all active links for the authenticated product list column", async () => {
    const res = response()
    await GET(request(links, {}) as never, res as never)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body).toMatchObject({ links })
    expect(res.headers).toMatchObject({ "Cache-Control": "no-store", Pragma: "no-cache" })
  })

  it("filters exact and partial private codes without exposing unrelated links", async () => {
    const res = response()
    await GET(request(links, { q: " dpgs22 " }) as never, res as never)
    expect(res.body).toMatchObject({ links: [links[0]], product_ids: ["prod_1"] })
  })
})
