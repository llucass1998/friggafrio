import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { MERCADO_PAGO_PROVIDER_ID } from "../../../../../lib/payment-provider-bootstrap"
import { GET } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

describe("store cart payment-status endpoint", () => {
  it("returns none when cart has no payment session", async () => {
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [
          {
            id: "cart_test_1",
            payment_collection: { payment_sessions: [] },
          },
        ],
      }),
    }
    const res = response()
    await GET(
      {
        params: { id: "cart_test_1" },
        scope: {
          resolve: (key: unknown) => (key === ContainerRegistrationKeys.QUERY ? query : undefined),
        },
      } as never,
      res as never,
    )
    expect(res.body).toEqual({ status: "none" })
  })

  it("returns current status for pending Mercado Pago session", async () => {
    const query = {
      graph: jest.fn().mockResolvedValue({
        data: [
          {
            id: "cart_test_2",
            payment_collection: {
              payment_sessions: [
                {
                  id: "payses_test_1",
                  provider_id: MERCADO_PAGO_PROVIDER_ID,
                  status: "pending_authorization",
                  data: {
                    id: "ORD_123",
                    payment_method: "pix",
                  },
                },
              ],
            },
          },
        ],
      }),
    }
    const res = response()
    await GET(
      {
        params: { id: "cart_test_2" },
        scope: {
          resolve: (key: unknown) => (key === ContainerRegistrationKeys.QUERY ? query : undefined),
        },
      } as never,
      res as never,
    )
    expect(res.body).toMatchObject({
      status: "pending_authorization",
      session_id: "payses_test_1",
      payment_method: "pix",
    })
  })
})
