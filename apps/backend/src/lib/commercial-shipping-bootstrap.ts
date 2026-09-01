import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  deleteShippingOptionsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateShippingOptionsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  COMMERCIAL_SHIPPING_CALIBRATION_DEBT,
  COMMERCIAL_SHIPPING_POLICY_STATUS,
  COMMERCIAL_SHIPPING_RATES,
} from "../utils/commercial-shipping-policy"

const BOOTSTRAP_KEY = "frigga:commercial-shipping:v1"
const STOCK_LOCATION_NAME = "FriggaFrio - Loja 1 / Matriz"
const FULFILLMENT_SET_NAME = "FriggaFrio - Entregas SP"
const PROVIDER_ID = "frigga-shipping_frigga-shipping"

type RecordLike = Record<string, unknown>

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: RecordLike }) => Promise<{ data: unknown[] }>
}

type Link = {
  create: (links: RecordLike[]) => Promise<unknown>
}

type Fulfillment = {
  createFulfillmentSets: (data: RecordLike[]) => Promise<Array<{ id: string }>>
  createServiceZones: (data: RecordLike[]) => Promise<Array<{ id: string }>>
}

const isRecord = (value: unknown): value is RecordLike =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const hasBootstrapKey = (value: unknown): boolean =>
  isRecord(value) && value.commercial_shipping_bootstrap_key === BOOTSTRAP_KEY

const shippingOptionName = (rate: (typeof COMMERCIAL_SHIPPING_RATES)[number]) =>
  `FriggaFrio V1 - ${rate.key}`

const serviceZoneName = () => "FriggaFrio V1 - Brasil"

const optionData = (rate: (typeof COMMERCIAL_SHIPPING_RATES)[number]): RecordLike => {
  return {
    commercial_shipping_option: rate.key,
    commercial_rate_status: COMMERCIAL_SHIPPING_POLICY_STATUS,
    commercial_rate_calibration_debt: COMMERCIAL_SHIPPING_CALIBRATION_DEBT,
    estimated_delivery: rate.estimated_delivery,
    rate_type: rate.type,
    min_distance_km: rate.minDistanceKm,
    max_distance_km: rate.maxDistanceKm,
    free_shipping_threshold: rate.freeShippingThreshold,
    requires_grande_sp: rate.requiresGrandeSp === true,
  }
}

const optionInput = (
  rate: (typeof COMMERCIAL_SHIPPING_RATES)[number],
  serviceZoneId: string,
  shippingProfileId: string,
): RecordLike => ({
  name: shippingOptionName(rate),
  service_zone_id: serviceZoneId,
  shipping_profile_id: shippingProfileId,
  provider_id: PROVIDER_ID,
  price_type: "calculated",
  type: {
    label: "Entrega FriggaFrio",
    description: rate.estimated_delivery,
    code: `frigga-${rate.key.toLowerCase()}`,
  },
  data: optionData(rate),
  rules: [
    {
      attribute: rate.key,
      operator: "eq",
      value: "true",
    },
  ],
})

const getSingle = <T>(items: T[], description: string): T | undefined => {
  if (items.length > 1) throw new Error(`Multiple ${description} records match the commercial shipping bootstrap.`)
  return items[0]
}

/**
 * Idempotently creates the operational Medusa fulfillment graph. Service zones
 * uses native Brazil geography. Server-side rules only enable options after
 * trustworthy address/distance resolution; no guessed CEP range is involved.
 */
export const ensureCommercialShippingConfiguration = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const link = container.resolve(ContainerRegistrationKeys.LINK) as Link
  const fulfillment = container.resolve(Modules.FULFILLMENT) as unknown as Fulfillment

  const [locationsResult, channelsResult, profilesResult, providersResult, setsResult, zonesResult, optionsResult] = await Promise.all([
    query.graph({ entity: "stock_location", fields: ["id", "name", "metadata", "sales_channels.id", "fulfillment_sets.id", "fulfillment_providers.id"] }),
    query.graph({ entity: "sales_channel", fields: ["id", "name", "is_disabled"] }),
    query.graph({ entity: "shipping_profile", fields: ["id", "name", "type"] }),
    query.graph({ entity: "fulfillment_provider", fields: ["id", "is_enabled"] }),
    query.graph({ entity: "fulfillment_set", fields: ["id", "name", "type"] }),
    query.graph({ entity: "service_zone", fields: ["id", "name", "fulfillment_set_id"] }),
    query.graph({ entity: "shipping_option", fields: ["id", "name", "data", "service_zone_id"] }),
  ])

  const locations = locationsResult.data as Array<RecordLike>
  const channels = channelsResult.data as Array<RecordLike>
  const profiles = profilesResult.data as Array<RecordLike>
  const providers = providersResult.data as Array<RecordLike>
  const sets = setsResult.data as Array<RecordLike>
  const zones = zonesResult.data as Array<RecordLike>
  const options = optionsResult.data as Array<RecordLike>

  const salesChannel = getSingle(
    channels.filter((channel) => channel.name === "Canal Brasil" && channel.is_disabled !== true),
    "active Canal Brasil sales channel",
  )
  const shippingProfile = getSingle(
    profiles.filter((profile) => profile.name === "Default Shipping Profile"),
    "default shipping profile",
  )
  const provider = getSingle(
    providers.filter((candidate) => candidate.id === PROVIDER_ID && candidate.is_enabled === true),
    "enabled manual fulfillment provider",
  )
  if (!salesChannel?.id || !shippingProfile?.id || !provider?.id) {
    throw new Error("Brazil sales channel, default shipping profile, and enabled manual_manual provider are required.")
  }

  let location = getSingle(
    locations.filter((candidate) => candidate.name === STOCK_LOCATION_NAME || hasBootstrapKey(candidate.metadata)),
    "FriggaFrio Matriz stock location",
  )
  if (!location?.id) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: STOCK_LOCATION_NAME,
            address: {
              address_1: "Alameda Glete, 663",
              city: "São Paulo",
              province: "br-sp",
              postal_code: "01215-001",
              country_code: "br",
            },
            metadata: {
              commercial_shipping_bootstrap_key: BOOTSTRAP_KEY,
              operation: "FriggaFrio Loja 1 / Matriz",
              district: "Campos Elíseos",
            },
          },
        ],
      },
    })
    location = result[0] as unknown as RecordLike
  }

  const locationSalesChannels = (location.sales_channels as Array<RecordLike> | undefined) ?? []
  if (!locationSalesChannels.some((channel) => channel.id === salesChannel.id)) {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: String(location.id), add: [String(salesChannel.id)], remove: [] },
    })
  }
  const locationProviders = (location.fulfillment_providers as Array<RecordLike> | undefined) ?? []
  if (!locationProviders.some((candidate) => candidate.id === PROVIDER_ID)) {
    await link.create([
      {
        [Modules.STOCK_LOCATION]: { stock_location_id: String(location.id) },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: PROVIDER_ID },
      },
    ])
  }

  let fulfillmentSet = getSingle(
    sets.filter((set) => set.name === FULFILLMENT_SET_NAME),
    "FriggaFrio SP fulfillment set",
  )
  if (!fulfillmentSet?.id) {
    const created = await fulfillment.createFulfillmentSets([{ name: FULFILLMENT_SET_NAME, type: "shipping" }])
    fulfillmentSet = created[0] as unknown as RecordLike
  }
  const locationSets = (location.fulfillment_sets as Array<RecordLike> | undefined) ?? []
  if (!locationSets.some((set) => set.id === fulfillmentSet?.id)) {
    await link.create([
      {
        [Modules.STOCK_LOCATION]: { stock_location_id: String(location.id) },
        [Modules.FULFILLMENT]: { fulfillment_set_id: String(fulfillmentSet.id) },
      },
    ])
  }

  let serviceZone = getSingle(
    zones.filter((candidate) => candidate.name === serviceZoneName()),
    "Brazil commercial service zone",
  )
  if (!serviceZone?.id) {
    const created = await fulfillment.createServiceZones([
      {
        name: serviceZoneName(),
        fulfillment_set_id: String(fulfillmentSet.id),
        geo_zones: [{ type: "country", country_code: "br" }],
      },
    ])
    serviceZone = created[0] as unknown as RecordLike
  }

  // Remove only FriggaFrio V1 options that are no longer part of the central
  // policy. Unrelated merchant shipping options remain untouched.
  const desiredRateKeys = new Set(COMMERCIAL_SHIPPING_RATES.map((rate) => rate.key))
  const obsolete = options.filter((candidate) => {
    const name = String(candidate.name ?? "")
    const configuredKey = isRecord(candidate.data) && typeof candidate.data.commercial_shipping_option === "string"
      ? candidate.data.commercial_shipping_option
      : undefined
    return name.startsWith("FriggaFrio V1 - ") && (!configuredKey || !desiredRateKeys.has(configuredKey as (typeof COMMERCIAL_SHIPPING_RATES)[number]["key"]))
  })
  if (obsolete.length) {
    await deleteShippingOptionsWorkflow(container).run({ input: { ids: obsolete.map((option) => String(option.id)) } })
  }

  for (const rate of COMMERCIAL_SHIPPING_RATES) {
    const existing = getSingle(
      options.filter((candidate) => candidate.name === shippingOptionName(rate)),
      `${rate.key} shipping option`,
    )
    const data = optionInput(rate, String(serviceZone.id), String(shippingProfile.id))
    if (existing?.id) {
      await updateShippingOptionsWorkflow(container).run({
        input: [{ id: String(existing.id), ...data }],
      })
    } else {
      await createShippingOptionsWorkflow(container).run({ input: [data as never] })
    }
  }

  return {
    location_id: String(location.id),
    fulfillment_set_id: String(fulfillmentSet.id),
    service_zone_count: 1,
    shipping_option_count: COMMERCIAL_SHIPPING_RATES.length,
    policy_status: COMMERCIAL_SHIPPING_POLICY_STATUS,
  }
}
