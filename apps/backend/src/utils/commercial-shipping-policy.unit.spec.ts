import {
  COMMERCIAL_SHIPPING_RATES,
  FREE_SHIPPING_THRESHOLD,
  HttpShippingDistanceProvider,
  createCommercialShippingContext,
  createShippingDistanceProviderFromEnv,
  isConfiguredGrandeSpAddress,
  matchingExpressRate,
} from "./commercial-shipping-policy"

const distanceProvider = (distanceKm: number) => ({
  resolveDistance: async () => ({ status: "resolved" as const, distanceKm }),
})

describe("commercial shipping V1 policy", () => {
  it.each([
    [5, 80], [10, 80], [15, 100], [20, 100], [25, 120],
    [35, 140], [45, 160], [55, 180], [70, 200], [90, 250], [100, 250],
  ])("maps %dkm to the official express amount", (distance, amount) => {
    expect(matchingExpressRate(distance)?.amount).toBe(amount)
  })

  it.each([0, -1, 100.01, Number.NaN, Number.POSITIVE_INFINITY])("does not offer express outside its supported interval: %p", (distance) => {
    expect(matchingExpressRate(distance)).toBeUndefined()
  })

  it("fails closed when no trusted distance provider exists", async () => {
    const context = await createCommercialShippingContext({ address: { country_code: "br", city: "Sao Paulo" } })
    expect(context.commercial_shipping_distance_status).toBe("unavailable")
    expect(Object.values(context).filter((value) => value === "true")).toHaveLength(0)
  })

  it("reports the external credential blocker when route provider is absent", async () => {
    const originalUrl = process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
    const originalKey = process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY
    delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
    delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY
    try {
      const provider = createShippingDistanceProviderFromEnv()
      await expect(provider.resolveDistance({ country_code: "br", city: "Sao Paulo" }))
        .resolves.toEqual({ status: "unavailable", reason: "EXTERNAL_CREDENTIAL_REQUIRED" })
    } finally {
      if (originalUrl === undefined) delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL
      else process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL = originalUrl
      if (originalKey === undefined) delete process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY
      else process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY = originalKey
    }
  })

  it("accepts only a numeric route distance from the configured provider", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ routes: [{ distanceMeters: 12_500 }] }), { status: 200 }),
    )
    try {
      await expect(new HttpShippingDistanceProvider("https://route.invalid", "test-key")
        .resolveDistance({ country_code: "br", city: "Osasco", postal_code: "06000-000", address_1: "Rua A" }))
        .resolves.toEqual({ status: "resolved", distanceKm: 12.5 })
      expect(fetchMock).toHaveBeenCalledTimes(1)
      expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
        headers: expect.objectContaining({
          "x-goog-api-key": "test-key",
          "x-goog-fieldmask": "routes.distanceMeters",
        }),
      })
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("offers both valid methods for configured Grande SP at the threshold", async () => {
    const context = await createCommercialShippingContext({
      address: { country_code: "br", city: "Osasco" },
      grandeSpCities: new Set(["osasco"]),
      lines: [{ quantity: 2, unit_price: 200 }],
      distanceProvider: distanceProvider(10),
    })
    expect(context.FRIGGAFRIO_STANDARD_FREE_GRANDE_SP).toBe("true")
    expect(context.FRIGGAFRIO_EXPRESS_0_10).toBe("true")
  })

  it("uses only the official server-side Grande SP municipality set", () => {
    const originalCities = process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES
    delete process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES
    try {
      expect(isConfiguredGrandeSpAddress({ country_code: "br", city: "São Paulo" })).toBe(true)
      expect(isConfiguredGrandeSpAddress({ country_code: "br", city: "Osasco" })).toBe(true)
      expect(isConfiguredGrandeSpAddress({ country_code: "br", city: "Campinas" })).toBe(false)
      expect(isConfiguredGrandeSpAddress({ country_code: "us", city: "São Paulo" })).toBe(false)
    } finally {
      if (originalCities === undefined) delete process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES
      else process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES = originalCities
    }
  })

  it("enforces the R$399.99/R$400 boundary without counting blocked lines", async () => {
    const context = await createCommercialShippingContext({
      address: { country_code: "br", city: "Osasco" }, grandeSpCities: new Set(["osasco"]),
      lines: [
        { quantity: 1, unit_price: FREE_SHIPPING_THRESHOLD, metadata: { commercial_status: "QUOTE_ONLY" } },
        { quantity: 1, unit_price: FREE_SHIPPING_THRESHOLD, metadata: { price_pending: true } },
        { quantity: 1, unit_price: 399.99 },
      ],
    })
    expect(context.FRIGGAFRIO_STANDARD_FREE_GRANDE_SP).toBe("false")

    const thresholdContext = await createCommercialShippingContext({
      address: { country_code: "br", city: "Osasco" },
      grandeSpCities: new Set(["osasco"]),
      lines: [{ quantity: 1, unit_price: FREE_SHIPPING_THRESHOLD }],
    })
    expect(thresholdContext.FRIGGAFRIO_STANDARD_FREE_GRANDE_SP).toBe("true")
  })

  it("has precisely one explicit zero-priced option", () => {
    expect(COMMERCIAL_SHIPPING_RATES.filter((rate) => rate.amount === 0).map((rate) => rate.key))
      .toEqual(["FRIGGAFRIO_STANDARD_FREE_GRANDE_SP"])
  })
})
