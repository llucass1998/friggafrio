import {
  COMMERCIAL_SHIPPING_RATES,
  FREE_SHIPPING_THRESHOLD,
  HttpShippingDistanceProvider,
  createCommercialShippingContext,
  SHIPPING_POLICY,
  motoboyAmountCentavos,
  carAmountCentavos,
  createShippingDistanceProviderFromEnv,
  isConfiguredGrandeSpAddress,
  matchingExpressRate,
  createShippingPolicyQuote,
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

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("does not offer express outside its supported interval: %p", (distance) => {
    expect(matchingExpressRate(distance)).toBeUndefined()
  })

  it("includes zero distance in the first motoboy band", () => {
    expect(matchingExpressRate(0)?.amount).toBe(80)
  })

  it("keeps express rate boundaries finite and rejects incompatible distances", () => {
    expect(matchingExpressRate(10)?.key).toBe("FRIGGAFRIO_EXPRESS_0_10")
    expect(matchingExpressRate(10.01)?.key).toBe("FRIGGAFRIO_EXPRESS_10_20")
    expect(matchingExpressRate(100)?.key).toBe("FRIGGAFRIO_EXPRESS_80_100")
    expect(matchingExpressRate(-0.01)).toBeUndefined()
    expect(matchingExpressRate(Number.NaN)).toBeUndefined()
  })

  it("keeps pickup and eligible car selectable when no trusted distance provider exists", async () => {
    const context = await createCommercialShippingContext({ address: { country_code: "br", city: "Sao Paulo" } })
    expect(context.commercial_shipping_distance_status).toBe("unavailable")
    expect(context.FRIGGAFRIO_PICKUP_STORE_1).toBe("true")
    expect(context.FRIGGAFRIO_CAR_CENTRAL).toBe("true")
    expect(context.FRIGGAFRIO_EXPRESS_0_10).toBe("false")
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
      const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
      expect(Object.keys(headers)).toContain("x-goog-api-key")
      expect(headers["x-goog-api-key"]).toHaveLength("test-key".length)
    } finally {
      fetchMock.mockRestore()
    }
  })

  it("records a sanitized ComputeRoutes diagnostic for a provider 403", async () => {
    const fetchMock = jest.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: { status: "PERMISSION_DENIED", message: "must not be logged" } }), {
        status: 403,
        headers: { "x-request-id": "routes_request_sanitized" },
      }),
    )
    const warnMock = jest.spyOn(console, "warn").mockImplementation()
    try {
      await expect(new HttpShippingDistanceProvider("https://routes.googleapis.com/directions/v2:computeRoutes", "test-key")
        .resolveDistance({ country_code: "br", city: "Sao Paulo", postal_code: "05144-085", address_1: "Rua A" }))
        .resolves.toEqual({ status: "unavailable", reason: "PROVIDER_FAILURE" })
      expect(warnMock).toHaveBeenCalledWith("ComputeRoutes provider failure", {
        service: "routes.googleapis.com",
        status: 403,
        reason: "PERMISSION_DENIED",
        request_id: "routes_request_sanitized",
      })
    } finally {
      fetchMock.mockRestore()
      warnMock.mockRestore()
    }
  })

  it("offers both valid methods at the approved subtotal threshold", async () => {
    const context = await createCommercialShippingContext({
      address: { country_code: "br", city: "Osasco" },
      lines: [{ quantity: 5, unit_price: 200 }],
      distanceProvider: distanceProvider(10),
    })
    expect(context.FRIGGAFRIO_EXPRESS_0_10).toBe("true")
  })

  it("uses only the official server-side Grande SP municipality set", () => {
    const originalCities = process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES
    delete process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES
    try {
      expect(isConfiguredGrandeSpAddress({ country_code: "br", city: "Sao Paulo" })).toBe(true)
      expect(isConfiguredGrandeSpAddress({ country_code: "br", city: "Osasco" })).toBe(true)
      expect(isConfiguredGrandeSpAddress({ country_code: "br", city: "Campinas" })).toBe(false)
      expect(isConfiguredGrandeSpAddress({ country_code: "us", city: "Sao Paulo" })).toBe(false)
    } finally {
      if (originalCities === undefined) delete process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES
      else process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES = originalCities
    }
  })

  it("enforces the R$999.99/R$1000 boundary without counting blocked lines", async () => {
    const context = await createCommercialShippingContext({
      address: { country_code: "br", city: "Osasco" },
      lines: [
        { quantity: 1, unit_price: FREE_SHIPPING_THRESHOLD, metadata: { commercial_status: "QUOTE_ONLY" } },
        { quantity: 1, unit_price: FREE_SHIPPING_THRESHOLD, metadata: { price_pending: true } },
        { quantity: 1, unit_price: 999.99 },
      ],
    })
    expect(context.FRIGGAFRIO_EXPRESS_0_10).toBe("false")

    const thresholdContext = await createCommercialShippingContext({
      address: { country_code: "br", city: "Osasco" },
      lines: [{ quantity: 1, unit_price: FREE_SHIPPING_THRESHOLD }],
    })
    expect(thresholdContext.FRIGGAFRIO_EXPRESS_0_10).toBe("false")
  })

  it("has precisely one explicit zero-priced option", () => {
    expect(COMMERCIAL_SHIPPING_RATES.filter((rate) => rate.amount === 0).map((rate) => rate.key))
      .toEqual(["FRIGGAFRIO_PICKUP_STORE_1", "FRIGGAFRIO_CAR_CENTRAL"])
  })

  it("keeps pickup free and calculates motoboy boundaries in centavos", () => {
    expect(SHIPPING_POLICY.pickup.amountCentavos).toBe(0)
    expect(motoboyAmountCentavos(10)).toBe(8000)
    expect(motoboyAmountCentavos(20)).toBe(10000)
    expect(motoboyAmountCentavos(100)).toBe(25000)
    expect(motoboyAmountCentavos(100.1)).toBeUndefined()
    expect(motoboyAmountCentavos(101)).toBeUndefined()
    expect(motoboyAmountCentavos(120)).toBeUndefined()
  })

  it("keeps car pricing server-side by region and subtotal", () => {
    expect(carAmountCentavos("CENTRAL_NEAR", 1)).toBe(0)
    expect(carAmountCentavos("INTERIOR", 99999)).toBe(15000)
    expect(carAmountCentavos("INTERIOR", 100000)).toBe(25000)
    expect(carAmountCentavos("COAST", 100000)).toBe(25000)
    expect(carAmountCentavos("OUT_OF_COVERAGE", 100000)).toBeUndefined()
  })

  it("keeps the three delivery cards visible and eligible for CEP 05144-085", async () => {
    const quote = await createShippingPolicyQuote({
      address: { country_code: "br", city: "Sao Paulo", province: "SP", postal_code: "05144-085", address_1: "Rua Example, 1" },
      lines: [{ quantity: 1, unit_price: 100 }],
      distanceProvider: distanceProvider(12),
    })
    expect(quote.options.map((option) => option.modality)).toEqual(["pickup", "car", "motoboy"])
    expect(quote.options.map((option) => option.available)).toEqual([true, true, true])
    expect(quote.options[1]).toMatchObject({ amountCentavos: 0, estimatedDelivery: "Até 3 dias úteis" })
    expect(quote.options[2]).toMatchObject({ amountCentavos: 10000, distanceKm: 12 })
  })

  it("keeps unavailable motoboy visible with an explanatory reason", async () => {
    const quote = await createShippingPolicyQuote({
      address: { country_code: "br", city: "Sao Paulo", province: "SP", postal_code: "05144-085", address_1: "Rua Example, 1" },
      distanceProvider: { resolveDistance: async () => ({ status: "unavailable" as const, reason: "EXTERNAL_CREDENTIAL_REQUIRED" as const }) },
    })
    expect(quote.options.map((option) => option.modality)).toEqual(["pickup", "car", "motoboy"])
    expect(quote.options[2]).toMatchObject({ available: false, reason: expect.stringContaining("temporariamente") })
  })

  it("keeps motoboy visible but unavailable over the approved 100km limit", async () => {
    const quote = await createShippingPolicyQuote({
      address: { country_code: "br", city: "Sao Paulo", province: "SP", postal_code: "05144-085", address_1: "Rua Example, 1" },
      distanceProvider: distanceProvider(100.1),
    })
    expect(quote.options[2]).toMatchObject({ modality: "motoboy", available: false, reason: "Entrega expressa indisponível para este endereço." })
  })

  it.each(["RJ", "MG", "ES", "PR"])("blocks every delivery modality outside SP for UF %s", async (province) => {
    const provider = jest.fn(async () => ({ status: "resolved" as const, distanceKm: 5 }))
    const quote = await createShippingPolicyQuote({
      address: { country_code: "br", province, city: "Sao Paulo", postal_code: "01001-000", address_1: "Rua Example, 1" },
      lines: [{ quantity: 1, unit_price: 100 }],
      distanceProvider: { resolveDistance: provider },
    })
    expect(quote.region).toBe("OUT_OF_COVERAGE")
    expect(quote.options[0]).toMatchObject({ modality: "pickup", available: true, amountCentavos: 0 })
    expect(quote.options.slice(1)).toEqual(expect.arrayContaining([
      expect.objectContaining({ modality: "car", available: false, amountCentavos: 0 }),
      expect.objectContaining({ modality: "motoboy", available: false, amountCentavos: 0 }),
    ]))
    expect(quote.options[1]?.reason).toContain("somente no estado de São Paulo")
    expect(quote.options[2]?.reason).toContain("somente no estado de São Paulo")
    expect(provider).not.toHaveBeenCalled()
  })
})
