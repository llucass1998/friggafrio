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
    expect(res.body).toMatchObject({ status: "ready", options: [{ id: "FRIGGAFRIO_PICKUP_STORE_1", amount: 0 }, { id: "FRIGGAFRIO_CAR_CENTRAL", amount: 0 }, { id: "FRIGGAFRIO_EXPRESS_0_10", amount: 80 }] })
  })

  it("returns a persisted shipping option id for cart selection", async () => {
    const cart = makeCart()
    const query = {
      graph: jest.fn().mockImplementation(async ({ entity }: { entity: string }) => {
        if (entity === "cart") return { data: [cart] }
        if (entity === "shipping_option") return { data: [
          { id: "so_pickup", data: { commercial_shipping_option: "FRIGGAFRIO_PICKUP_STORE_1" } },
          { id: "so_car", data: { commercial_shipping_option: "FRIGGAFRIO_CAR_CENTRAL" } },
          { id: "so_express", data: { commercial_shipping_option: "FRIGGAFRIO_EXPRESS_0_10" } },
        ] }
        return { data: [] }
      }),
    }
    const res = response()
    await POST({
      body: { cart_id: cart.id },
      scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined },
    } as never, res as never)

    expect(res.body).toMatchObject({
      options: [
        { id: "FRIGGAFRIO_PICKUP_STORE_1", shipping_option_id: "so_pickup" },
        { id: "FRIGGAFRIO_CAR_CENTRAL", shipping_option_id: "so_car" },
        { id: "FRIGGAFRIO_EXPRESS_0_10", shipping_option_id: "so_express" },
      ],
    })
  })

  it("keeps all three cards visible when the destination cannot be resolved", async () => {
    const res = response()
    await POST({ body: { postal_code: "01310-100" }, scope: { resolve: jest.fn() } } as never, res as never)
    expect(res.statusCode).toBe(422)
    expect(res.body).toMatchObject({
      status: "unavailable",
      reason: "ADDRESS_NOT_RESOLVABLE",
      options: [
        { modality: "pickup", available: true, amount: 0 },
        { modality: "car", available: false },
        { modality: "motoboy", available: false },
      ],
    })
  })

  it("blocks non-SP delivery before consulting the route provider", async () => {
    const cart = makeCart()
    cart.shipping_address.province = "RJ"
    const query = { graph: jest.fn().mockResolvedValue({ data: [cart] }) }
    const res = response()
    await POST({
      body: { cart_id: cart.id },
      scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? query : undefined },
    } as never, res as never)

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      region: "OUT_OF_COVERAGE",
      options: [
        { modality: "pickup", available: true, amount: 0 },
        { modality: "car", available: false, amount: 0 },
        { modality: "motoboy", available: false, amount: 0 },
      ],
    })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
