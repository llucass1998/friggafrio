import type { CommercialLine } from "./cart-commercial-eligibility"

export const COMMERCIAL_SHIPPING_POLICY_STATUS = "OFFICIAL_V1" as const
export const SHIPPING_POLICY_VERSION = "1" as const
export const COMMERCIAL_SHIPPING_CALIBRATION_DEBT =
  "V1.1 - review delivery economics, extend the radius when viable, and improve route resolution." as const

export const EXPRESS_DELIVERY_COPY = "Entrega expressa em até 6 horas em dia útil."
export const STANDARD_DELIVERY_COPY = "Entrega padrão grátis — até 3 dias úteis."
// Medusa 2.x exposes money in major currency units (R$400, not 40000).
export const FREE_SHIPPING_THRESHOLD_CENTAVOS = 100000
export const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_CENTAVOS / 100
export const SHIPPING_CURRENCY = "brl"

export const SHIPPING_POLICY = {
  version: SHIPPING_POLICY_VERSION,
  store: { name: "FriggaFrio Loja 1", address: "Alameda Glete, 663", district: "Campos Elíseos", city: "São Paulo", province: "SP", postalCode: "01215-001" },
  pickup: { key: "FRIGGAFRIO_PICKUP_STORE_1", amountCentavos: 0, label: "Retirada na Loja — FriggaFrio Loja 1" },
  motoboy: [
    { min: 0, max: 10, amountCentavos: 8000 }, { min: 10, max: 20, amountCentavos: 10000 },
    { min: 20, max: 30, amountCentavos: 12000 }, { min: 30, max: 40, amountCentavos: 14000 },
    { min: 40, max: 50, amountCentavos: 16000 }, { min: 50, max: 60, amountCentavos: 18000 },
    { min: 60, max: 80, amountCentavos: 20000 }, { min: 80, max: 100, amountCentavos: 25000 },
  ],
  motoboyOver100: { baseCentavos: 25000, perKmCentavos: 300, minimumCentavos: 30000 },
  // Car delivery is free only in the central coverage area. In every other
  // serviceable area in SP, charge R$150 plus 10% of the product subtotal.
  car: { nonCentralBaseCentavos: 15000, nonCentralSubtotalRateBasisPoints: 1000 },
} as const

export type ShippingRegion = "CENTRAL_NEAR" | "GRANDE_SP" | "INTERIOR" | "COAST" | "OUT_OF_COVERAGE"

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

type RouteProviderErrorResponse = {
  error?: { status?: unknown; message?: unknown; details?: Array<{ reason?: unknown }> }
}

const SHIPPING_ORIGIN = "Alameda Glete, 663, Sao Paulo, SP, 01215-001, Brazil"

const formatDestinationAddress = (address: CommercialShippingAddress): string => [
  address.address_1,
  address.city,
  address.province,
  address.postal_code,
  address.country_code,
].filter((part): part is string => Boolean(part?.trim())).join(", ")

const sanitizedProviderCode = (value: unknown): string | undefined =>
  typeof value === "string" && /^[A-Z0-9_./-]{1,80}$/i.test(value) ? value : undefined

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
      if (!response.ok) {
        let reason = `HTTP_${response.status}`
        try {
          const payload = await response.json() as RouteProviderErrorResponse
          reason = sanitizedProviderCode(payload.error?.status)
            ?? sanitizedProviderCode(payload.error?.details?.[0]?.reason)
            ?? reason
        } catch {
          // The provider can return a non-JSON error page; keep the diagnostic opaque.
        }
        const service = new URL(this.endpoint).hostname
        const requestId = response.headers.get("x-request-id") ?? response.headers.get("x-goog-request-id") ?? undefined
        console.warn("ComputeRoutes provider failure", { service, status: response.status, reason, request_id: requestId })
        return { status: "unavailable", reason: "PROVIDER_FAILURE" }
      }
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

export const computeHaversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export class CepRoutingDistanceProvider implements ShippingDistanceProvider {
  private static cache = new Map<string, number>()

  constructor(private readonly timeoutMs = 4000) {}

  async resolveDistance(address: CommercialShippingAddress): Promise<ShippingDistanceResult> {
    if (address.country_code && address.country_code.toLowerCase() !== "br") {
      return { status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE" }
    }
    if (address.province && address.province.toLowerCase() !== "sp") {
      return { status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE" }
    }
    const rawCep = address.postal_code?.replace(/\D/g, "")
    if (!rawCep || rawCep.length !== 8) {
      return { status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE" }
    }

    const cached = CepRoutingDistanceProvider.cache.get(rawCep)
    if (typeof cached === "number") {
      return { status: "resolved", distanceKm: cached }
    }

    try {
      let coords = await this.fetchCoordsFromAwesomeApi(rawCep)
      if (!coords) {
        coords = await this.fetchCoordsFromBrasilApi(rawCep)
      }
      if (!coords) {
        return { status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE" }
      }

      let distanceKm = await this.fetchDrivingDistanceKmFromOsrm(coords.lon, coords.lat)
      if (typeof distanceKm !== "number") {
        const straightKm = computeHaversineKm(-23.5475, -46.63611, coords.lat, coords.lon)
        distanceKm = Math.round(straightKm * 1.3 * 10) / 10
      }

      CepRoutingDistanceProvider.cache.set(rawCep, distanceKm)
      return { status: "resolved", distanceKm }
    } catch {
      return { status: "unavailable", reason: "PROVIDER_FAILURE" }
    }
  }

  private async fetchCoordsFromAwesomeApi(cep: string): Promise<{ lat: number; lon: number } | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(`https://cep.awesomeapi.com.br/json/${cep}`, { signal: controller.signal })
      if (!res.ok) return null
      const data = await res.json() as { lat?: string; lng?: string }
      const lat = Number(data.lat)
      const lon = Number(data.lng)
      if (Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0) {
        return { lat, lon }
      }
      return null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  private async fetchCoordsFromBrasilApi(cep: string): Promise<{ lat: number; lon: number } | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal: controller.signal })
      if (!res.ok) return null
      const data = await res.json() as { location?: { coordinates?: { latitude?: string | number; longitude?: string | number } } }
      const lat = Number(data.location?.coordinates?.latitude)
      const lon = Number(data.location?.coordinates?.longitude)
      if (Number.isFinite(lat) && Number.isFinite(lon) && lat !== 0 && lon !== 0) {
        return { lat, lon }
      }
      return null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }

  private async fetchDrivingDistanceKmFromOsrm(lon: number, lat: number): Promise<number | null> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2500)
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/-46.63611,-23.5475;${lon},${lat}?overview=false`
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) return null
      const data = await res.json() as { routes?: Array<{ distance?: number }> }
      const meters = data.routes?.[0]?.distance
      if (typeof meters === "number" && Number.isFinite(meters) && meters >= 0) {
        return Math.round((meters / 1000) * 10) / 10
      }
      return null
    } catch {
      return null
    } finally {
      clearTimeout(timer)
    }
  }
}

export class CompositeShippingDistanceProvider implements ShippingDistanceProvider {
  constructor(
    private readonly primary?: ShippingDistanceProvider,
    private readonly fallback = new CepRoutingDistanceProvider(),
  ) {}

  async resolveDistance(address: CommercialShippingAddress): Promise<ShippingDistanceResult> {
    if (this.primary) {
      try {
        const result = await this.primary.resolveDistance(address)
        if (result.status === "resolved") {
          return result
        }
      } catch {
        // Fallback to cep routing
      }
    }
    const postalCode = address.postal_code?.replace(/\D/g, "")
    if (!postalCode && !this.primary) {
      return { status: "unavailable", reason: "EXTERNAL_CREDENTIAL_REQUIRED" }
    }
    return this.fallback.resolveDistance(address)
  }
}

export const createShippingDistanceProviderFromEnv = (): ShippingDistanceProvider => {
  const endpoint = process.env.FRIGGAFRIO_ROUTE_PROVIDER_URL?.trim()
  const apiKey = process.env.FRIGGAFRIO_ROUTE_PROVIDER_API_KEY?.trim()
  const primary = endpoint && apiKey ? new HttpShippingDistanceProvider(endpoint, apiKey) : undefined
  return new CompositeShippingDistanceProvider(primary)
}

export type ShippingRateKey =
  | "FRIGGAFRIO_PICKUP_STORE_1"
  | "FRIGGAFRIO_EXPRESS_0_10"
  | "FRIGGAFRIO_EXPRESS_10_20"
  | "FRIGGAFRIO_EXPRESS_20_30"
  | "FRIGGAFRIO_EXPRESS_30_40"
  | "FRIGGAFRIO_EXPRESS_40_50"
  | "FRIGGAFRIO_EXPRESS_50_60"
  | "FRIGGAFRIO_EXPRESS_60_80"
  | "FRIGGAFRIO_EXPRESS_80_100"
  | "FRIGGAFRIO_EXPRESS_OVER_100"
  | "FRIGGAFRIO_CAR_CENTRAL"
  | "FRIGGAFRIO_CAR_GRANDE_SP"
  | "FRIGGAFRIO_CAR_INTERIOR_ECONOMIC"
  | "FRIGGAFRIO_CAR_COAST_ECONOMIC"

export type CommercialShippingRate = {
  key: ShippingRateKey
  amount: number
  amountCentavos?: number
  estimated_delivery: string
  type: "express" | "standard_free" | "pickup" | "standard_paid"
  minDistanceKm?: number
  maxDistanceKm?: number
  requiresGrandeSp?: boolean
  freeShippingThreshold?: number
}

// Medusa 2.x prices stay server-side in BRL major units. Bounds are (min, max].
export const COMMERCIAL_SHIPPING_RATES: readonly CommercialShippingRate[] = [
  { key: "FRIGGAFRIO_PICKUP_STORE_1", type: "pickup", amount: 0, amountCentavos: 0, estimated_delivery: "Aguardando preparação" },
  { key: "FRIGGAFRIO_EXPRESS_0_10", type: "express", minDistanceKm: 0, maxDistanceKm: 10, amount: 80, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_10_20", type: "express", minDistanceKm: 10, maxDistanceKm: 20, amount: 100, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_20_30", type: "express", minDistanceKm: 20, maxDistanceKm: 30, amount: 120, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_30_40", type: "express", minDistanceKm: 30, maxDistanceKm: 40, amount: 140, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_40_50", type: "express", minDistanceKm: 40, maxDistanceKm: 50, amount: 160, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_50_60", type: "express", minDistanceKm: 50, maxDistanceKm: 60, amount: 180, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_60_80", type: "express", minDistanceKm: 60, maxDistanceKm: 80, amount: 200, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_80_100", type: "express", minDistanceKm: 80, maxDistanceKm: 100, amount: 250, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_EXPRESS_OVER_100", type: "express", minDistanceKm: 100, amount: 300, estimated_delivery: EXPRESS_DELIVERY_COPY },
  { key: "FRIGGAFRIO_CAR_CENTRAL", type: "standard_free", amount: 0, amountCentavos: 0, estimated_delivery: STANDARD_DELIVERY_COPY },
  { key: "FRIGGAFRIO_CAR_GRANDE_SP", type: "standard_paid", amount: 150, amountCentavos: 15000, estimated_delivery: STANDARD_DELIVERY_COPY },
  { key: "FRIGGAFRIO_CAR_INTERIOR_ECONOMIC", type: "standard_paid", amount: 150, amountCentavos: 15000, estimated_delivery: "Rota programada para quarta-feira" },
  { key: "FRIGGAFRIO_CAR_COAST_ECONOMIC", type: "standard_paid", amount: 150, amountCentavos: 15000, estimated_delivery: "Rota programada para quinta-feira" },
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

const configuredCities = (name: string, fallback: string[]): Set<string> => {
  const raw = process.env[name]?.split(",").map(normalize).filter(Boolean) ?? []
  return new Set(raw.length ? raw : fallback.map(normalize))
}

// Keep the canonical city keys ASCII so input encoding cannot change coverage.
const defaultCentralCities = ["Sao Paulo"]
const defaultCoastCities = ["Santos", "Guaruja", "Bertioga", "Sao Vicente", "Praia Grande", "Mongagua", "Itanhaem", "Peruibe", "Ubatuba", "Caraguatatuba", "Sao Sebastiao", "Ilhabela"]

export const classifyShippingRegion = (address: CommercialShippingAddress): ShippingRegion => {
  if (normalize(address.country_code) !== "br") return "OUT_OF_COVERAGE"
  // Explicit non-SP UFs are never eligible for delivery; pickup remains valid.
  const province = normalize(address.province)
  if (province && province !== "sp") return "OUT_OF_COVERAGE"
  const city = normalize(address.city)
  if (configuredCities("FRIGGAFRIO_SHIPPING_CENTRAL_CITIES", defaultCentralCities).has(city)) return "CENTRAL_NEAR"
  if (configuredCities("FRIGGAFRIO_SHIPPING_COAST_CITIES", defaultCoastCities).has(city)) return "COAST"
  if (officialGrandeSpCities.has(city)) return "GRANDE_SP"
  return city ? "INTERIOR" : "OUT_OF_COVERAGE"
}

export const motoboyAmountCentavos = (distanceKm: number): number | undefined => {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) return undefined
  const band = SHIPPING_POLICY.motoboy.find((item, index) => (index === 0 ? distanceKm >= item.min : distanceKm > item.min) && distanceKm <= item.max)
  if (band) return band.amountCentavos
  return undefined
}

export const carAmountCentavos = (region: ShippingRegion, subtotalCentavos: number): number | undefined => {
  if (region === "CENTRAL_NEAR") return 0
  if (region === "GRANDE_SP" || region === "INTERIOR" || region === "COAST") {
    const percentageCentavos = Math.round(
      subtotalCentavos * SHIPPING_POLICY.car.nonCentralSubtotalRateBasisPoints / 10_000,
    )
    return SHIPPING_POLICY.car.nonCentralBaseCentavos + percentageCentavos
  }
  return undefined
}

export type ShippingQuoteOption = {
  id: string
  modality: "pickup" | "motoboy" | "car"
  label: string
  carrier: string
  vehicle: string
  amountCentavos: number
  currencyCode: "brl"
  available: boolean
  reason?: string
  distanceKm?: number
  estimatedDelivery?: string
  estimatedDate?: string
  policyVersion: typeof SHIPPING_POLICY_VERSION
}

const unavailableReasonForDistance = (distance: ShippingDistanceResult): string => {
  if (distance.status === "resolved") return "Entrega expressa indisponível para este endereço."
  if (distance.reason === "ADDRESS_NOT_RESOLVABLE") return "Entrega expressa indisponível para este endereço."
  if (distance.reason === "EXTERNAL_CREDENTIAL_REQUIRED" || distance.reason === "DISTANCE_PROVIDER_UNCONFIGURED") {
    return "Entrega expressa temporariamente indisponível. Tente novamente mais tarde."
  }
  return "Não foi possível calcular a entrega expressa. Tente novamente."
}

const outOfStateDeliveryReason =
  "No momento, realizamos entregas somente no estado de São Paulo. Você ainda pode escolher a Retirada na Loja 1."

const carRateKeyFor = (region: ShippingRegion, _subtotalCentavos: number): ShippingRateKey => {
  if (region === "CENTRAL_NEAR") return "FRIGGAFRIO_CAR_CENTRAL"
  if (region === "GRANDE_SP") return "FRIGGAFRIO_CAR_GRANDE_SP"
  if (region === "INTERIOR") return "FRIGGAFRIO_CAR_INTERIOR_ECONOMIC"
  if (region === "COAST") return "FRIGGAFRIO_CAR_COAST_ECONOMIC"
  return "FRIGGAFRIO_CAR_CENTRAL"
}

const carUnavailableReason = (region: ShippingRegion): string =>
  region === "OUT_OF_COVERAGE"
    ? outOfStateDeliveryReason
    : region === "GRANDE_SP"
      ? "Entrega normal indisponível para este CEP."
      : "Entrega normal indisponível para este endereço."

export const createUnavailableShippingQuoteOptions = (reason = "Informe um CEP válido para consultar as modalidades."): ShippingQuoteOption[] => [
  {
    id: SHIPPING_POLICY.pickup.key,
    modality: "pickup",
    label: SHIPPING_POLICY.pickup.label,
    carrier: "FriggaFrio",
    vehicle: "Retirada na Loja 1",
    amountCentavos: 0,
    currencyCode: "brl",
    available: true,
    estimatedDelivery: "Aguardando preparação",
    policyVersion: SHIPPING_POLICY_VERSION,
  },
  {
    id: "FRIGGAFRIO_CAR_CENTRAL",
    modality: "car",
    label: "Entrega normal — Carro FriggaFrio",
    carrier: "FriggaFrio",
    vehicle: "Carro da empresa",
    amountCentavos: 0,
    currencyCode: "brl",
    available: false,
    reason,
    estimatedDelivery: "Até 3 dias úteis",
    policyVersion: SHIPPING_POLICY_VERSION,
  },
  {
    id: "FRIGGAFRIO_EXPRESS_0_10",
    modality: "motoboy",
    label: "Entrega expressa — Motoboy",
    carrier: "FriggaFrio",
    vehicle: "Motoboy",
    amountCentavos: 0,
    currencyCode: "brl",
    available: false,
    reason,
    estimatedDelivery: "Até 6 horas quando elegível",
    policyVersion: SHIPPING_POLICY_VERSION,
  },
]

const nextWeekday = (weekday: number, now = new Date()): string => {
  const result = new Date(now)
  const delta = (weekday - result.getDay() + 7) % 7 || 7
  result.setDate(result.getDate() + delta)
  return result.toISOString().slice(0, 10)
}

export const createShippingPolicyQuote = async ({
  address,
  lines = [],
  distanceProvider = createShippingDistanceProviderFromEnv(),
}: {
  address: CommercialShippingAddress
  lines?: CommercialLine[]
  distanceProvider?: ShippingDistanceProvider
}): Promise<{ region: ShippingRegion; subtotalCentavos: number; distanceStatus: ShippingDistanceResult["status"]; options: ShippingQuoteOption[] }> => {
  const region = classifyShippingRegion(address)
  const subtotalCentavos = eligibleCommercialSubtotalCentavos(lines)
  const carKey = carRateKeyFor(region, subtotalCentavos)
  const carAmount = carAmountCentavos(region, subtotalCentavos)
  const options: ShippingQuoteOption[] = [
    {
      id: SHIPPING_POLICY.pickup.key,
      modality: "pickup",
      label: SHIPPING_POLICY.pickup.label,
      carrier: "FriggaFrio",
      vehicle: "Retirada na Loja 1",
      amountCentavos: 0,
      currencyCode: "brl",
      available: true,
      estimatedDelivery: "Aguardando preparação",
      policyVersion: SHIPPING_POLICY_VERSION,
    },
    {
      id: carKey,
      modality: "car",
      label: "Entrega normal — Carro FriggaFrio",
      carrier: "FriggaFrio",
      vehicle: "Carro da empresa",
      amountCentavos: carAmount ?? 0,
      currencyCode: "brl",
      available: carAmount !== undefined,
      reason: carAmount === undefined ? carUnavailableReason(region) : undefined,
      estimatedDelivery: "Até 3 dias úteis",
      estimatedDate: region === "INTERIOR" ? nextWeekday(3) : region === "COAST" ? nextWeekday(4) : undefined,
      policyVersion: SHIPPING_POLICY_VERSION,
    },
  ]
  // Delivery outside SP is rejected before consulting an external route provider.
  const distance = region === "OUT_OF_COVERAGE"
    ? { status: "unavailable" as const, reason: "ADDRESS_NOT_RESOLVABLE" as const }
    : await distanceProvider.resolveDistance(address)
  if (distance.status === "resolved") {
    const amountCentavos = motoboyAmountCentavos(distance.distanceKm)
    const expressKey = matchingExpressRate(distance.distanceKm)?.key
    options.push({
      id: expressKey ?? "FRIGGAFRIO_EXPRESS_OVER_100",
      modality: "motoboy",
      label: "Entrega expressa — Motoboy",
      carrier: "FriggaFrio",
      vehicle: "Motoboy",
      amountCentavos: amountCentavos ?? 0,
      currencyCode: "brl",
      available: amountCentavos !== undefined && expressKey !== undefined,
      reason: amountCentavos === undefined || expressKey === undefined ? unavailableReasonForDistance(distance) : undefined,
      distanceKm: distance.distanceKm,
      estimatedDelivery: amountCentavos !== undefined ? EXPRESS_DELIVERY_COPY : "Até 6 horas quando elegível",
      policyVersion: SHIPPING_POLICY_VERSION,
    })
  } else {
    options.push({
      id: "FRIGGAFRIO_EXPRESS_0_10",
      modality: "motoboy",
      label: "Entrega expressa — Motoboy",
      carrier: "FriggaFrio",
      vehicle: "Motoboy",
      amountCentavos: 0,
      currencyCode: "brl",
      available: false,
      reason: region === "OUT_OF_COVERAGE" ? outOfStateDeliveryReason : unavailableReasonForDistance(distance),
      estimatedDelivery: "Até 6 horas quando elegível",
      policyVersion: SHIPPING_POLICY_VERSION,
    })
  }
  return { region, subtotalCentavos, distanceStatus: distance.status, options }
}

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

const moneyToCentavos = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) return 0
  const [whole, fraction = ""] = String(value).split(".")
  const normalizedFraction = `${fraction}00`.slice(0, 2)
  return Number(whole) * 100 + Number(normalizedFraction)
}

export const eligibleCommercialSubtotalCentavos = (lines: CommercialLine[]): number => {
  let subtotal = 0
  for (const line of lines) {
    const blocked = commercialMetadata(line, "commercial_status") === "QUOTE_ONLY"
      || commercialMetadata(line, "product_sales_policy") === "QUOTE_ONLY"
      || commercialMetadata(line, "is_quote_only") === true
      || commercialMetadata(line, "price_pending") === true
    if (blocked || !Number.isSafeInteger(line.quantity) || (line.quantity as number) < 1 || typeof line.unit_price !== "number") continue
    subtotal += moneyToCentavos(line.unit_price as number) * (line.quantity as number)
  }
  return subtotal
}

export const matchingExpressRate = (distanceKm: number): CommercialShippingRate | undefined =>
  COMMERCIAL_SHIPPING_RATES.filter((rate) => rate.type === "express").find((rate, index) =>
    Number.isFinite(distanceKm)
    && (index === 0 ? distanceKm >= (rate.minDistanceKm ?? Number.POSITIVE_INFINITY) : distanceKm > (rate.minDistanceKm ?? Number.POSITIVE_INFINITY))
    && (rate.maxDistanceKm === undefined ? distanceKm > 100 : distanceKm <= rate.maxDistanceKm))

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
  if (classifyShippingRegion(address) === "OUT_OF_COVERAGE") {
    distance = { status: "unavailable", reason: "ADDRESS_NOT_RESOLVABLE" }
  } else {
    try {
      distance = await distanceProvider.resolveDistance(address)
    } catch {
      distance = { status: "unavailable", reason: "PROVIDER_FAILURE" }
    }
  }
  const enabled = new Set<ShippingRateKey>()
  // Pickup is independent from address and must always remain selectable.
  enabled.add("FRIGGAFRIO_PICKUP_STORE_1")
  const subtotalCentavos = eligibleCommercialSubtotalCentavos(lines)
  const carKey = carRateKeyFor(classifyShippingRegion(address), subtotalCentavos)
  if (carAmountCentavos(classifyShippingRegion(address), subtotalCentavos) !== undefined) {
    enabled.add(carKey)
  }
  if (distance.status === "resolved" && motoboyAmountCentavos(distance.distanceKm) !== undefined) {
    const express = matchingExpressRate(distance.distanceKm)
    if (express) enabled.add(express.key)
  }
  const subtotal = eligibleCommercialSubtotal(lines)
  return Object.fromEntries([
    ...COMMERCIAL_SHIPPING_RATES.map((rate) => [rate.key, enabled.has(rate.key) ? "true" : "false"] as const),
    ["commercial_shipping_policy", COMMERCIAL_SHIPPING_POLICY_STATUS],
    ["commercial_shipping_distance_status", distance.status],
    ["commercial_merchandise_subtotal", subtotal],
  ]) as CommercialShippingContext
}
