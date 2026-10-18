import { POST } from "./route"
import { updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"

jest.mock("@medusajs/medusa/core-flows", () => ({
  createInventoryLevelsWorkflow: jest.fn(() => ({ run: jest.fn().mockResolvedValue({}) })),
  updateInventoryLevelsWorkflow: jest.fn(() => ({ run: jest.fn().mockResolvedValue({}) })),
  createProductsWorkflow: jest.fn(() => ({ run: jest.fn().mockResolvedValue({}) })),
  updateProductsWorkflow: jest.fn(() => ({ run: jest.fn().mockResolvedValue({}) })),
}))

const mockResponse = () => {
  const result = { statusCode: 200, payload: undefined as unknown }
  return {
    status(code: number) { result.statusCode = code; return this },
    json(payload: unknown) { result.payload = payload; return this },
    get statusCode() { return result.statusCode },
    get payload() { return result.payload },
  }
}

describe("Omie Webhook Receiver", () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv, OMIE_APP_KEY: "valid_app_key" }
    jest.clearAllMocks()
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it("rejects unauthorized webhook when appKey does not match", async () => {
    const res = mockResponse()
    const req = {
      body: { appKey: "wrong_key", topic: "Produto.MovimentacaoEstoque" },
      scope: { resolve: jest.fn() },
    }
    await POST(req as never, res as never)
    expect(res.statusCode).toBe(401)
    expect(res.payload).toEqual({ error: "unauthorized" })
  })

  it("acknowledges safely when payload has no product identifiers", async () => {
    const res = mockResponse()
    const req = {
      body: { appKey: "valid_app_key", topic: "Produto.MovimentacaoEstoque", eventData: {} },
      scope: { resolve: jest.fn() },
    }
    await POST(req as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ received: true, skipped: true, reason: "missing_product_identifiers" })
  })

  it("updates stock in real-time when Produto.MovimentacaoEstoque is received", async () => {
    const runMock = jest.fn().mockResolvedValue({})
    ;(updateInventoryLevelsWorkflow as unknown as jest.Mock).mockReturnValue({ run: runMock })

    const queryMock = {
      graph: jest.fn()
        .mockResolvedValueOnce({
          data: [{
            id: "prod_1",
            title: "Compressor",
            metadata: { omie_external_id: "12345" },
            variants: [{
              id: "var_1",
              sku: "COMP-01",
              inventory_items: [{ inventory_item_id: "inv_item_1" }],
            }],
          }],
        })
        .mockResolvedValueOnce({
          data: [{ id: "loc_matriz", name: "FriggaFrio - Loja 1 / Matriz" }],
        })
        .mockResolvedValueOnce({
          data: [{
            id: "level_1",
            inventory_item_id: "inv_item_1",
            location_id: "loc_matriz",
            stocked_quantity: 5,
            reserved_quantity: 0,
          }],
        }),
    }

    const res = mockResponse()
    const req = {
      body: {
        appKey: "valid_app_key",
        topic: "Produto.MovimentacaoEstoque",
        messageId: "msg_123",
        eventData: {
          nCodProd: 12345,
          cCodigo: "COMP-01",
          nSaldoAtual: 18,
        },
      },
      scope: {
        resolve: jest.fn((key: string) => {
          if (key === "Query" || key === "query") return queryMock
          return { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
        }),
      },
    }

    await POST(req as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({
      received: true,
      updated: true,
      productId: "prod_1",
      stockedQuantity: 18,
    })
    expect(runMock).toHaveBeenCalledWith({
      input: {
        updates: [{
          inventory_item_id: "inv_item_1",
          location_id: "loc_matriz",
          stocked_quantity: 18,
        }],
      },
    })
  })
})
