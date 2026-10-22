import { GET } from "./route"

const mockResponse = () => {
  const result: {
    statusCode?: number
    body?: { metrics?: Record<string, unknown> }
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
      result.body = body as { metrics?: Record<string, unknown> }
      return result
    }),
  }
  return result
}

const mockRequest = (mockGraph: jest.Mock) => ({
  query: {},
  scope: {
    resolve: () => ({ graph: mockGraph }),
  },
})

describe("Admin catalog metrics route", () => {
  it("calculates correct metrics from raw products and Omie links", async () => {
    const mockProducts = [
      {
        id: "prod_1",
        status: "published",
        thumbnail: "https://example.com/img1.jpg",
        images: [{ url: "https://example.com/img1.jpg" }],
        collection_id: "col_1",
        sales_channels: [{ id: "sc_1" }],
        metadata: {},
        variants: [
          {
            id: "var_1",
            inventory_quantity: 10,
            prices: [{ amount: 150 }],
          },
        ],
      },
      {
        id: "prod_2",
        status: "draft",
        thumbnail: null,
        images: [],
        collection_id: null,
        sales_channels: [],
        metadata: { commercial_status: "QUOTE_ONLY" },
        variants: [
          {
            id: "var_2",
            inventory_quantity: 0,
            prices: [],
          },
        ],
      },
    ]

    const mockOmieLinks = [
      { id: "link_1", product_id: "prod_1" },
    ]

    const mockGraph = jest.fn().mockImplementation(({ entity }: { entity: string }) => {
      if (entity === "product") {
        return Promise.resolve({ data: mockProducts })
      }
      if (entity === "frigga_omie_product_link") {
        return Promise.resolve({ data: mockOmieLinks })
      }
      return Promise.resolve({ data: [] })
    })

    const res = mockResponse()
    await GET(mockRequest(mockGraph) as never, res as never)

    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.headers).toMatchObject({
      "Cache-Control": "no-store",
      Pragma: "no-cache",
    })

    const metrics = res.body?.metrics
    expect(metrics).toBeDefined()
    expect(metrics?.total).toBe(2)
    expect(metrics?.published).toBe(1)
    expect(metrics?.draft).toBe(1)
    expect(metrics?.no_image).toBe(1)
    expect(metrics?.no_price).toBe(1)
    expect(metrics?.quote_only).toBe(1)
    expect(metrics?.no_collection).toBe(1)
    expect(metrics?.no_sales_channel).toBe(1)
    expect(metrics?.omie_linked).toBe(1)
    expect(metrics?.omie_pending).toBe(1)
    expect(metrics?.no_stock).toBe(1)
    expect(typeof metrics?.last_updated).toBe("string")
  })
})
