import { GET } from "./route"

const mockResponse = () => {
  const result: {
    statusCode?: number
    body?: {
      products?: Array<Record<string, unknown>>
      count?: number
      limit?: number
      offset?: number
      filter?: string
      q?: string
    }
    headers: Record<string, string>
    setHeader: jest.Mock
    status: jest.Mock
    json: jest.Mock
  } = {
    headers: {},
    setHeader: jest.fn((name: string, value: string) => {
      result.headers[name] = value
    }),
    status: jest.fn((statusCode: number) => {
      result.statusCode = statusCode
      return result
    }),
    json: jest.fn((body: unknown) => {
      result.body = body as typeof result.body
      return result
    }),
  }
  return result
}

const mockRequest = (query: Record<string, unknown>, mockGraph: jest.Mock) => ({
  query,
  scope: {
    resolve: () => ({ graph: mockGraph }),
  },
})

describe("Admin catalog items route", () => {
  const mockProducts = [
    {
      id: "prod_1",
      title: "Luva Redutora 1/2 FriggaFrio",
      handle: "luva-redutora-1-2",
      status: "published",
      thumbnail: "https://example.com/img1.jpg",
      images: [{ url: "https://example.com/img1.jpg" }],
      collection_id: "col_1",
      collection: { id: "col_1", title: "Conexões" },
      categories: [{ id: "cat_1", name: "Tubos e Conexões" }],
      metadata: { brand: "FriggaFrio" },
      variants: [
        {
          id: "var_1",
          sku: "LUV-12",
          inventory_quantity: 15,
          prices: [{ amount: 45.5, currency_code: "BRL" }],
        },
      ],
      created_at: "2026-01-01T10:00:00.000Z",
    },
    {
      id: "prod_2",
      title: "Gás Refrigerante R134a",
      handle: "gas-refrigerante-r134a",
      status: "published",
      thumbnail: null,
      images: [],
      collection_id: null,
      collection: null,
      categories: [],
      metadata: {},
      variants: [
        {
          id: "var_2",
          sku: "GAS-R134",
          inventory_quantity: 0,
          prices: [],
        },
      ],
      created_at: "2026-01-02T10:00:00.000Z",
    },
    {
      id: "prod_3",
      title: "Compressor Hermético 1/3 HP",
      handle: "compressor-hermetico-1-3",
      status: "draft",
      thumbnail: "https://example.com/img3.jpg",
      images: [{ url: "https://example.com/img3.jpg" }],
      collection_id: "col_2",
      collection: { id: "col_2", title: "Compressores" },
      categories: [],
      metadata: {},
      variants: [
        {
          id: "var_3",
          sku: "COMP-13",
          inventory_quantity: 5,
          prices: [{ amount: 450, currency_code: "BRL" }],
        },
      ],
      created_at: "2026-01-03T10:00:00.000Z",
    },
  ]

  const mockOmieLinks = [
    {
      id: "link_1",
      code_display: "VBLR1214",
      code_normalized: "VBLR1214",
      product_id: "prod_1",
      variant_id: "var_1",
      source: "omie",
    },
    {
      id: "link_2",
      code_display: "DPGS1348",
      code_normalized: "DPGS1348",
      product_id: "prod_2",
      variant_id: "var_2",
      source: "omie",
    },
  ]

  const createMockGraph = () =>
    jest.fn().mockImplementation(({ entity }: { entity: string }) => {
      if (entity === "product") {
        return Promise.resolve({ data: mockProducts })
      }
      if (entity === "frigga_omie_product_link") {
        return Promise.resolve({ data: mockOmieLinks })
      }
      return Promise.resolve({ data: [] })
    })

  it("returns all products with pagination and Omie links attached", async () => {
    const res = mockResponse()
    await GET(mockRequest({ limit: "2", offset: "0" }, createMockGraph()) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body?.count).toBe(3)
    expect(res.body?.products?.length).toBe(2)
    // Products sorted by created_at desc (prod_3, prod_2)
    expect(res.body?.products?.[0].id).toBe("prod_3")
    expect(res.body?.products?.[1].id).toBe("prod_2")
    expect(res.body?.products?.[1].omie_link).toMatchObject({
      code_display: "DPGS1348",
    })
  })

  it("filters products without image (no_image)", async () => {
    const res = mockResponse()
    await GET(mockRequest({ filter: "no_image" }, createMockGraph()) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body?.count).toBe(1)
    expect(res.body?.products?.[0].id).toBe("prod_2")
  })

  it("filters products without price (no_price)", async () => {
    const res = mockResponse()
    await GET(mockRequest({ filter: "no_price" }, createMockGraph()) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body?.count).toBe(1)
    expect(res.body?.products?.[0].id).toBe("prod_2")
  })

  it("filters products without Omie link (no_omie)", async () => {
    const res = mockResponse()
    await GET(mockRequest({ filter: "no_omie" }, createMockGraph()) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body?.count).toBe(1)
    expect(res.body?.products?.[0].id).toBe("prod_3")
  })

  it("searches products by Omie code", async () => {
    const res = mockResponse()
    await GET(mockRequest({ q: "VBLR1214" }, createMockGraph()) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body?.count).toBe(1)
    expect(res.body?.products?.[0].id).toBe("prod_1")
  })

  it("searches products by SKU", async () => {
    const res = mockResponse()
    await GET(mockRequest({ q: "GAS-R134" }, createMockGraph()) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.body?.count).toBe(1)
    expect(res.body?.products?.[0].id).toBe("prod_2")
  })
})
