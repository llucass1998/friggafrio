import type { CommercialLine } from "./cart-commercial-eligibility"

export const COMMERCIAL_SHIPPING_POLICY_STATUS = "OFFICIAL_V1" as const
export const COMMERCIAL_SHIPPING_CALIBRATION_DEBT =
  "V1.1 - review delivery economics, extend the radius when viable, and improve route resolution." as const

export const EXPRESS_DELIVERY_COPY = "Entrega expressa em até 6 horas em dia útil."
export const STANDARD_DELIVERY_COPY = "Entrega padrão grátis — até 3 dias úteis."
// Medusa 2.x exposes money in major currency units (R$400, not 40000).
export const FREE_SHIPPING_THRESHOLD = 400
export const SHIPPING_CURRENCY = "brl"

export type CommercialShippingAddress = {
  country_code?: string | null
  province?: string | null
  city?: string | null
  postal_code?: string | null
  address_1?: string | null
}

export type ShippingDistanceResult =
  | { status: "resolved"; distanceKm: number }
  | {
    status: "unavailable"
    reason: "EXTERNAL_CREDENTIAL_REQUIRED" | "DISTANCE_PROVIDER_UNCONFIGURED" | "ADDRESS_NOT_RESOLVABLE" | "PROVIDER_FAILURE"
  }

/** A production adapter must resolve a route from the persisted address. */
export interface ShippingDistanceProvider {
  resolveDistance(address: CommercialShippingAddress): Promise<ShippingDistanceResult>
}

export class UnconfiguredShippingDistanceProvider implements ShippingDistanceProvider {
  async resolveDistance(): Promise<ShippingDistanceResult> {
    return { status: "unavailable", reason: "EXTERNAL_CREDENTIAL_REQUIRED" }
  }
}

type RouteProviderResponse = {
  routes?: Array<{ distanceMeters?: unknown }>
}

const SHIPPING_ORIGIN = "Alameda Glete, 663, Sao Paulo, SP, 01215-001, Brazil"

const formatDestinationAddress = (address: CommercialShippingAddress): string => [
  address.address_1,
  address.city,
  address.province,
  address.postal_code,
  address.country_code,
].filter((part): part is string => Boolean(part?.trim())).join(", ")

/**
 * Adapter for Google Routes Compute Routes. The service must return a route
 * distance in meters; no geodesic or city/CEP fallback is allowed.
 */
export class HttpShippingDistanceProvider implements ShippingDistanceProvider {
  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly timeoutMs = 5_000,
  ) {}

  async resolveDistance(address: CommercialShippingAddress): Promise<ShippingDistanceResult> {
    if (!address.country_code || !address.postal_code || !address.address_1 || !address.city) {
      return { status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE" }
    }
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": this.apiKey,
          "x-goog-fieldmask": "routes.distanceMeters",
        },
        body: JSON.stringify({
          origin: { address: SHIPPING_ORIGIN },
          destination: { address: formatDestinationAddress(address) },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
        signal: controller.signal,
      })
      if (!response.ok) return { status: "unavailable", reason: "PROVIDER_FAILURE" }
      const payload = await response.json() as RouteProviderResponse
      const distanceMeters = payload.routes?.[0]?.distanceMeters
      if (typeof distanceMeters !== "number" || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
        return { status: "unavailable", reason: "PROVIDER_FAILURE" }
      }
      return { status: "resolved", distanceKm: distanceMeters / 1000 }
    } catch {
      return { status: "unavailable", reason: "PROVIDER_FAILURE" }
    } finally {
      clearTimeout(timeout)
    }
  }
}

export const createShippingDistanceProviderFromEnv = (): ShippingDistanceProvider => {
  const endpoint = process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL?.trim()
  const apiKey = process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY?.trim()
  return endpoint && apiKey ? new HttpShippingDistanceProvider(endpoint, apiKey) : new UnconfiguredShippingDistanceProvider()
}

export type ShippingRateKey =
  | "FRIGGAFRIO_EXPRESS_0_10"
  | "FRIGGAFRIO_EXPRESS_10_20"
  | "FRIGGAFRIO_EXPRESS_20_30"
  | "FRIGGAFRIO_EXPRESS_30_40"
  | "FRIGGAFRIO_EXPRESS_40_50"
  | "FRIGGAFRIO_EXPRESS_50_60"
  | "FRIGGAFRIO_EXPRESS_60_80"
  | "FRIGGAFRIO_EXPRESS_80_100"
  | "FRIGGAFRIO_STANDARD_FREE_GRANDE_SP"

export type CommercialShippingRate = {
  key: ShippingRateKey
  amount: number
  estimated_delivery: string
  type: "express" | "standard_free"
  minDistanceKm?: number
  maxDistanceKm?: number
  requiresGrandeSp?: boolean
  freeShippingThreshold?: number
}

// Medusa 2.x prices stay server-side in BRL major units. Bounds are (min, max].
export const COMMERCIAL_SHIPPING_RATES: readonly CommercialShippingRate[] = [
  { key: "FRIGGAFRIO_EXPRESS_0_10", type: "express", minDistanceKm: 0, maxDistanceKm: 10, amount: 80, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_10_20", type: "express", minDistanceKm: 10, maxDistanceKm: 20, amount: 100, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_20_30", type: "express", minDistanceKm: 20, maxDistanceKm: 30, amount: 120, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_30_40", type: "express", minDistanceKm: 30, maxDistanceKm: 40, amount: 140, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_40_50", type: "express", minDistanceKm: 40, maxDistanceKm: 50, amount: 160, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_50_60", type: "express", minDistanceKm: 50, maxDistanceKm: 60, amount: 180, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_60_80", type: "express", minDistanceKm: 60, maxDistanceKm: 80, amount: 200, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_80_100", type: "express", minDistanceKm: 80, maxDistanceKm: 100, amount: 250, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_STANDARD_FREE_GRANDE_SP", type: "standard_free", amount: 0, estimated_delivery: STANDARD_DELIVERY_COPY, requiresGrandeSp: true, freeShippingThreshold: FREE_SHIPPING_THRESHOLD },
] as const

export type CommercialShippingContext = Record<ShippingRateKey, "true" | "false"> & {
  commercial_shipping_policy: typeof COMMERCIAL_SHIPPING_POLICY_STATUS
  commercial_shipping_distance_status: ShippingDistanceResult["status"]
  commercial_merchandise_subtotal: number
}

const normalize = (value: string | null | undefined): string =>
  value?.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR") ?? ""

// Official RMSP municipality set (Lei Complementar Estadual 1.139/2011).
// This stays server-side; environment overrides are accepted only for names
// that belong to this approved set.
export const OFFICIAL_GRANDE_SP_MUNICIPALITIES = [
  "Aruja",
  "Barueri",
  "Biritiba-Mirim",
  "Caieiras",
  "Cajamar",
  "Carapicuiba",
  "Cotia",
  "Diadema",
  "Embu das Artes",
  "Embu-Guacu",
  "Ferraz de Vasconcelos",
  "Francisco Morato",
  "Franco da Rocha",
  "Guararema",
  "Guarulhos",
  "Itapecerica da Serra",
  "Itapevi",
  "Itaquaquecetuba",
  "Jandira",
  "Juquitiba",
  "Mairipora",
  "Maua",
  "Mogi das Cruzes",
  "Osasco",
  "Pirapora do Bom Jesus",
  "Poa",
  "Ribeirao Pires",
  "Rio Grande da Serra",
  "Salesopolis",
  "Santa Isabel",
  "Santana de Parnaiba",
  "Santo Andre",
  "Sao Bernardo do Campo",
  "Sao Caetano do Sul",
  "Sao Lourenco da Serra",
  "Sao Paulo",
  "Suzano",
  "Taboao da Serra",
  "Vargem Grande Paulista",
] as const

const officialGrandeSpCities = new Set(OFFICIAL_GRANDE_SP_MUNICIPALITIES.map(normalize))

const configuredGrandeSpCities = (): Set<string> => {
  const configured = new Set(
    (process.env.FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES ?? "")
      .split(",")
      .map(normalize)
      .filter((city) => officialGrandeSpCities.has(city)),
  )
  return configured.size > 0 ? configured : new Set(officialGrandeSpCities)
}

export const isConfiguredGrandeSpAddress = (
  address: CommercialShippingAddress,
  cities = configuredGrandeSpCities(),
): boolean => normalize(address.country_code) === "br" && cities.has(normalize(address.city))

const commercialMetadata = (line: CommercialLine, key: string): unknown =>
  line.metadata?.[key] ?? line.variant?.metadata?.[key] ?? line.variant?.product?.metadata?.[key]

/** Only genuinely purchasable merchandise contributes to the free-shipping threshold. */
export const eligibleCommercialSubtotal = (lines: CommercialLine[]): number => {
  let subtotal = 0
  for (const line of lines) {
    const quoteOnly = commercialMetadata(line, "commercial_status") === "QUOTE_ONLY"
      || commercialMetadata(line, "product_sales_policy") === "QUOTE_ONLY"
      || commercialMetadata(line, "is_quote_only") === true
    const pricePending = commercialMetadata(line, "price_pending") === true
    const quantity = line.quantity
    const unitPrice = line.unit_price
    if (quoteOnly || pricePending || typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1
      || typeof unitPrice !== "number" || !Number.isFinite(unitPrice) || unitPrice <= 0) continue
    const lineTotal = quantity * unitPrice
    if (Number.isFinite(lineTotal) && Number.isFinite(subtotal + lineTotal)) subtotal += lineTotal
  }
  return subtotal
}

export const matchingExpressRate = (distanceKm: number): CommercialShippingRate | undefined =>
  COMMERCIAL_SHIPPING_RATES.find((rate) => rate.type === "express"
    && Number.isFinite(distanceKm)
    && distanceKm > (rate.minDistanceKm ?? Number.POSITIVE_INFINITY)
    && distanceKm <= (rate.maxDistanceKm ?? Number.NEGATIVE_INFINITY))

export const createCommercialShippingContext = async ({
  address,
  lines = [],
  distanceProvider = createShippingDistanceProviderFromEnv(),
  grandeSpCities,
}: {
  address: CommercialShippingAddress
  lines?: CommercialLine[]
  distanceProvider?: ShippingDistanceProvider
  grandeSpCities?: Set<string>
}): Promise<CommercialShippingContext> => {
  let distance: ShippingDistanceResult
  try {
    distance = await distanceProvider.resolveDistance(address)
  } catch {
    distance = { status: "unavailable", reason: "PROVIDER_FAILURE" }
  }
  const enabled = new Set<ShippingRateKey>()
  if (distance.status === "resolved") {
    const express = matchingExpressRate(distance.distanceKm)
    if (express) enabled.add(express.key)
  }
  const subtotal = eligibleCommercialSubtotal(lines)
  if (isConfiguredGrandeSpAddress(address, grandeSpCities) && subtotal >= FREE_SHIPPING_THRESHOLD) {
    enabled.add("FRIGGAFRIO_STANDARD_FREE_GRANDE_SP")
  }
  return Object.fromEntries([
    ...COMMERCIAL_SHIPPING_RATES.map((rate) => [rate.key, enabled.has(rate.key) ? "true" : "false"] as const),
    ["commercial_shipping_policy", COMMERCIAL_SHIPPING_POLICY_STATUS],
    ["commercial_shipping_distance_status", distance.status],
    ["commercial_merchandise_subtotal", subtotal],
  ]) as CommercialShippingContext
}
