import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { POST as checkoutReady } from "../../src/api/store/carts/[id]/checkout-ready/route"

jest.setTimeout(240 * 1000)

const databaseUrl = process.env.TEST_DATABASE_URL
const redisUrl = process.env.REDIS_URL

if (!databaseUrl || !redisUrl) {
  throw new Error("TEST_DATABASE_URL and REDIS_URL are required for checkout-ready integration tests")
}

type ResponseCapture = {
  statusCode?: number
  body?: Record<string, unknown>
  status: (code: number) => ResponseCapture
  json: (body: Record<string, unknown>) => ResponseCapture
}

const responseCapture = (): ResponseCapture => {
  const response: ResponseCapture = {
    status: (code) => { response.statusCode = code; return response },
    json: (body) => { response.body = body; return response },
  }
  return response
}

medusaIntegrationTestRunner({
  inApp: true,
  env: {
    DATABASE_URL: databaseUrl,
    DB_URL: databaseUrl,
    POSTGRES_URL: databaseUrl,
    REDIS_URL: redisUrl,
  },
  testSuite: ({ getContainer }) => {
    describe("legacy checkout-ready compatibility boundary", () => {
      it("cannot reserve or authorize a cart without Gate 7 preparation", async () => {
        const container = getContainer()
        const cart = await (container.resolve(Modules.CART) as unknown as {
          createCarts: (input: Record<string, unknown>) => Promise<{ id: string }>
        }).createCarts({ currency_code: "brl", customer_id: "customer_legacy_boundary" })
        const res = responseCapture()

        await checkoutReady({
          params: { id: cart.id },
          auth_context: { actor_id: "customer_legacy_boundary" },
          scope: container,
        } as never, res as never)

        expect(res.statusCode).toBe(409)
        expect(res.body).toMatchObject({ checkout_ready: false, code: "checkout_preparation_required" })
      })
    })
  },
})
