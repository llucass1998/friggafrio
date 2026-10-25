import { catalogBase, publicCatalogInput, queryPublicCatalog, queryPublicFacets } from "./public-query"

const request = (query: Record<string, unknown> = {}, raw = jest.fn()) => ({
  query, publishable_key_context: { sales_channel_ids: ["sc_public"] },
  scope: { resolve: () => ({ raw }) },
})

describe("Consulta pública paginada", () => {
  const originalPriceGate = process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED
  beforeEach(() => { process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED = "true" })
  afterEach(() => {
    if (originalPriceGate === undefined) delete process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED
    else process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED = originalPriceGate
  })
  it("normaliza equivalentes e não interpreta preço vazio como zero", () => {
    const input = publicCatalogInput(request({ brand: "b,a,b", category_id: ["cat"], price_max: "", q: " GÁS  R404A ", limit: 24 }) as never)
    expect(input.brands).toEqual(["a", "b"])
    expect(input.q).toBe("gas r404a")
    expect(input.max).toBeUndefined()
    expect(input.channels).toEqual(["sc_public"])
  })
  it("parametriza termos e escapa curingas sem alterar o SQL estrutural", () => {
    const input = publicCatalogInput(request({ q: "' OR 1=1 --_%", category: "cat", option_value_id: "ov_1" }) as never)
    const base = catalogBase(input)
    expect(base.sql).not.toContain("OR 1=1")
    expect(base.bindings).toContain("%' or 1=1 --\\_\\%%")
    expect(base.sql).toContain("product_variant_option")
    expect(base.sql).toContain("product_sales_channel")
    expect(base.sql).not.toContain("10000")
  })
  it("retorna total exato inclusive em páginas vazias com LIMIT no banco", async () => {
    const raw = jest.fn().mockResolvedValueOnce({ rows: [{ currency_code: "brl" }] })
      .mockResolvedValueOnce({ rows: [{ product_ids: [], count: 11050 }] })
    const req = request({ offset: 20000 }, raw)
    expect(await queryPublicCatalog(req as never, publicCatalogInput(req as never))).toEqual({ product_ids: [], count: 11050 })
    expect(raw.mock.calls[1][0]).toContain("LIMIT ? OFFSET ?")
    expect(raw.mock.calls[1][1].slice(-2)).toEqual([24,20000])
  })
  it("não consulta produtos ou inventário para promoções não homologadas", async () => {
    const req = request({ promotion: "true" })
    expect(await queryPublicCatalog(req as never, publicCatalogInput(req as never))).toEqual({ product_ids: [], count: 0 })
  })
  it("usa o Pricing Module quando equivalência de preço-base não foi aprovada", async () => {
    delete process.env.CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED
    const raw = jest.fn().mockResolvedValueOnce({ rows: [{ currency_code: "brl" }] })
      .mockResolvedValueOnce({ rows: [{ complex: false }] })
      .mockResolvedValueOnce({ rows: [{ price_set_id: "ps_1" }] })
      .mockResolvedValueOnce({ rows: [{ product_ids: ["p1"], count: 1 }] })
    const calculatePrices = jest.fn().mockResolvedValue([{ id: "ps_1", calculated_amount: 79.9 }])
    const req = { ...request({ price_min: 50 }, raw), scope: { resolve: (name: string) => name === "pricing" ? { calculatePrices } : { raw } } }
    await queryPublicCatalog(req as never, publicCatalogInput(req as never))
    expect(calculatePrices).toHaveBeenCalledWith({ id: ["ps_1"] }, { context: { currency_code: "brl", region_id: "" } })
    expect(raw.mock.calls[3][1]).toContain(JSON.stringify([{ price_set_id: "ps_1", amount: 79.9 }]))
  })
  it("relevance vazio não prioriza variantes de código ausente", async () => {
    const raw = jest.fn().mockResolvedValueOnce({ rows: [{ currency_code: "brl" }] }).mockResolvedValueOnce({ rows: [{ product_ids: [], count: 0 }] })
    const req = request({ sort: "relevance" },raw)
    await queryPublicCatalog(req as never, publicCatalogInput(req as never))
    expect(raw.mock.calls[1][0]).toContain("ORDER BY created_at DESC,id ASC")
    expect(raw.mock.calls[1][0]).not.toContain("THEN 1000")
  })
  it("não expande opções ocultas quando não há categoria selecionada", async () => {
    const raw = jest.fn().mockResolvedValueOnce({ rows: [{ currency_code: "brl" }] })
      .mockResolvedValueOnce({ rows: [{ complex: false }] })
      .mockResolvedValueOnce({ rows: [{ brands: [], price: { min: 10,max: 20 } }] })
    const req = request({},raw)
    const result = await queryPublicFacets(req as never, publicCatalogInput(req as never))
    expect(result.options).toEqual([])
    expect(result.price).toEqual({ min: 10,max: 20 })
    expect(raw).toHaveBeenCalledTimes(3)
  })
})
