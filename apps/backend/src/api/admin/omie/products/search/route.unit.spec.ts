import { GET } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((statusCode: number) => { result.statusCode = statusCode; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

const request = (data: unknown[], query: Record<string, string>) => ({
  query,
  scope: { resolve: () => ({ graph: jest.fn().mockResolvedValue({ data }) }) },
})

describe("Admin product search", () => {
  const originalKey = process.env.OMIE_APP_KEY
  const originalSecret = process.env.OMIE_APP_SECRET
  beforeEach(() => {
    delete process.env.OMIE_APP_KEY
    delete process.env.OMIE_APP_SECRET
  })
  afterAll(() => {
    if (originalKey === undefined) delete process.env.OMIE_APP_KEY
    else process.env.OMIE_APP_KEY = originalKey
    if (originalSecret === undefined) delete process.env.OMIE_APP_SECRET
    else process.env.OMIE_APP_SECRET = originalSecret
  })

  it("searches local title and SKU case-insensitively with trimmed input", async () => {
    const res = response()
    await GET(request([{ id: "prod_1", title: "Gas R134A", status: "published", metadata: {}, variants: [{ id: "v1", sku: "DPGS1347", inventory_quantity: 4 }] }], { q: " dpgs1347 " }) as never, res as never)
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body).toMatchObject({ found: true, results: [{ source: "Medusa", medusa_product_id: "prod_1", sku: "DPGS1347" }] })
  })

  it("accepts the code query used by the Admin search panel", async () => {
    const res = response()
    await GET(request([{ id: "prod_1", title: "Gas R134A", metadata: {}, variants: [{ id: "v1", sku: "DPGS1347", inventory_quantity: 4 }] }], { code: "DPGS1347" }) as never, res as never)
    expect(res.body).toMatchObject({ found: true, results: [{ medusa_product_id: "prod_1", sku: "DPGS1347" }] })
  })

  it("returns local results even when Omie credentials are unavailable", async () => {
    const res = response()
    await GET(request([{ id: "prod_1", title: "Produto local", metadata: {}, variants: [] }], { q: "produto" }) as never, res as never)
    expect(res.body).toMatchObject({ local: { count: 1 }, omie: { status: "credentials_missing" } })
  })

  it("returns partial matches from private FriggaFrio links", async () => {
    const res = response()
    const graph = jest.fn()
      .mockResolvedValueOnce({ data: [{ id: "link_1", code_display: "DPGS1347", code_normalized: "DPGS1347", product_id: "prod_1", variant_id: "v1" }] })
      .mockResolvedValueOnce({ data: [{ id: "prod_1", title: "Gas R134A", status: "published", metadata: {}, variants: [{ id: "v1", sku: "SKU-R134A", inventory_quantity: 4 }] }] })
    await GET({ query: { q: "DPGS13" }, scope: { resolve: () => ({ graph }) } } as never, res as never)
    expect(res.body).toMatchObject({
      found: true,
      results: [{ source: "Medusa", code: "DPGS1347", medusa_product_id: "prod_1", medusa_variant_id: "v1" }],
      local: { count: 0 },
    })
  })

  it("keeps the canonical Omie code when alternate fields are also present", async () => {
    const res = response()
    const originalUrl = process.env.OMIE_API_URL
    const originalKey = process.env.OMIE_APP_KEY
    const originalSecret = process.env.OMIE_APP_SECRET
    process.env.OMIE_API_URL = "https://omie.example.invalid"
    process.env.OMIE_APP_KEY = "fixture-key"
    process.env.OMIE_APP_SECRET = "fixture-secret"
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({
      produto_servico_cadastro: [{ codigo: "DPGS1348", cCodigo: "LEGACY-1348", descricao: "Gas R134A" }],
    }), { status: 200, headers: { "content-type": "application/json" } }))

    try {
      await GET(request([], { q: "DPGS1348" }) as never, res as never)
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.body).toMatchObject({ results: [{ source: "Omie", code: "DPGS1348" }] })
    } finally {
      fetchMock.mockRestore()
      if (originalUrl === undefined) delete process.env.OMIE_API_URL
      else process.env.OMIE_API_URL = originalUrl
      if (originalKey === undefined) delete process.env.OMIE_APP_KEY
      else process.env.OMIE_APP_KEY = originalKey
      if (originalSecret === undefined) delete process.env.OMIE_APP_SECRET
      else process.env.OMIE_APP_SECRET = originalSecret
    }
  })

  it("rejects malformed input before querying", async () => {
    const res = response()
    const graph = jest.fn()
    await GET({ query: { q: "DROP; TABLE" }, scope: { resolve: () => ({ graph }) } } as never, res as never)
    expect(res.status).toHaveBeenCalledWith(400)
    expect(graph).not.toHaveBeenCalled()
  })
})
