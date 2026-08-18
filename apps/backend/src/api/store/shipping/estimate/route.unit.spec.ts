import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { POST } from "./route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

const makeCart = () => ({
  id: "cart_estimate_1",
  customer_id: null,
  shipping_address: {
    address_1: "Rua A, 10",
    city: "Sao Paulo",
    province: "SP",
    postal_code: "01310-100",
    country_code: "br",
  },
  items: [{
    id: "li_1",
    quantity: 1,
    unit_price: 100,
    metadata: {},
    variant: { metadata: {}, product: { metadata: {} }, manage_inventory: true, inventory_quantity: 10 },
  }],
})

describe("server shipping estimate route", () => {
  const previousEndpoint = process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
  const previousKey = process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY

  beforeEach(() => {
    process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL = "https://routes.example.test/compute"
    process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY = "test-route-key"
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ routes: [{ distanceMeters: 5_000 }] }), { status: 200 }))
  })

  afterEach(() => {
    jest.restoreAllMocks()
    if (previousEndpoint === undefined) delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
    else process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL = previousEndpoint
    if (previousKey === undefined) delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY
    else process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY = previousKey
  })

  it("returns only server-derived options for a cart", async () => {
    const cart = makeCart()
    const query = { graph: jest.fn().mockResolvedValue({ data: [cart] }) }
    const res = response()
    await POST({
      body: { cart_id: cart.id, distance_km: 0, shipping_amount: 0 },
      scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined },
    } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({ status: "ready", options: [{ id: "FRIGGAFRIO_EXPRESS_0_10", amount: 80 }] })
  })

  it("fails closed when the destination cannot be resolved", async () => {
    const res = response()
    await POST({ body: { postal_code: "01310-100" }, scope: { resolve: jest.fn() } } as never, res as never)
    expect(res.statusCode).toBe(422)
    expect(res.body).toMatchObject({ status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE", options: [] })
  })
})
