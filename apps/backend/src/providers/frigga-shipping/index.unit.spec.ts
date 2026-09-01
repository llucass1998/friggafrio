import { FriggaShippingProviderService } from "./index"

describe("FriggaFrio calculated shipping provider", () => {
  const endpoint = process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
  const apiKey = process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY

  afterEach(() => {
    jest.restoreAllMocks()
    if (endpoint === undefined) delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
    else process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL = endpoint
    if (apiKey === undefined) delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY
    else process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY = apiKey
  })

  it("rejects a motoboy calculation above the approved 100km limit", async () => {
    process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL = "https://route.example.test"
    process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY = "unit-route-key"
    jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ routes: [{ distanceMeters: 120_000 }] }), { status: 200 }))
    const provider = new FriggaShippingProviderService()
    await expect(provider.calculatePrice(
      { commercial_shipping_option: "FRIGGAFRIO_EXPRESS_OVER_100" },
      {},
      { id: "cart_1", shipping_address: { country_code: "br", province: "SP", city: "Sao Paulo", postal_code: "01001-000", address_1: "Rua A" }, items: [] } as never,
    )).rejects.toThrow("outside the supported policy")
  })

  it("creates pickup fulfillment data with the initial operational status", async () => {
    const provider = new FriggaShippingProviderService()
    const result = await provider.createFulfillment(
      { commercial_shipping_option: "FRIGGAFRIO_PICKUP_STORE_1" },
      [],
      { metadata: { frigga_fulfillment_mode: "pickup" } },
      {},
    )
    expect(result).toMatchObject({
      data: {
        frigga_fulfillment_mode: "pickup",
        frigga_pickup_store_id: "frigga_store_1",
        frigga_pickup_status: "awaiting_preparation",
      },
      labels: [],
    })
  })
})
