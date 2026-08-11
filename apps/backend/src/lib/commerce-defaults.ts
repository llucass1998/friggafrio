export const COMMERCIAL_DEFAULTS = Object.freeze({
  bootstrapKey: "maestro:commercial-defaults:br-v1",
  countryCode: "br",
  currencyCode: "brl",
  localeCode: "pt-BR",
  regionName: "Brasil",
  salesChannelName: "Canal Brasil",
  storeName: "FriggaFrio"
})

export const DEFAULT_CURRENCY_CODE = COMMERCIAL_DEFAULTS.currencyCode

type Metadata = Record<string, unknown> | null | undefined

export type RegionSnapshot = {
  id: string
  name: string
  currency_code: string
  metadata?: Metadata
  countries?: Array<{ iso_2: string }>
}

export type SalesChannelSnapshot = {
  id: string
  name: string
  description?: string | null
  is_disabled: boolean
  metadata?: Metadata
}

export type StoreSnapshot = {
  id: string
  name: string
  default_region_id?: string | null
  default_sales_channel_id?: string | null
  default_location_id?: string | null
  created_at?: string | Date
  metadata?: Metadata
  supported_currencies?: Array<{
    currency_code: string
    is_default: boolean
    is_tax_inclusive?: boolean
  }>
  supported_locales?: Array<{ locale_code: string }>
}

export type CommercialState = {
  regions: RegionSnapshot[]
  salesChannels: SalesChannelSnapshot[]
  stores: StoreSnapshot[]
}

export type CommercialGraphQuery = {
  graph: (input: {
    entity: string
    fields: string[]
  }) => Promise<{ data: unknown[] }>
}

export const readCommercialState = async (
  query: CommercialGraphQuery
): Promise<CommercialState> => {
  const [regions, salesChannels, stores] = await Promise.all([
    query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code", "metadata", "countries.iso_2"]
    }),
    query.graph({
      entity: "sales_channel",
      fields: ["id", "name", "description", "is_disabled", "metadata"]
    }),
    query.graph({
      entity: "store",
      fields: [
        "id",
        "name",
        "default_region_id",
        "default_sales_channel_id",
        "default_location_id",
        "created_at",
        "metadata",
        "supported_currencies.currency_code",
        "supported_currencies.is_default",
        "supported_currencies.is_tax_inclusive",
        "supported_locales.locale_code"
      ]
    })
  ])

  return {
    regions: regions.data as RegionSnapshot[],
    salesChannels: salesChannels.data as SalesChannelSnapshot[],
    stores: stores.data as StoreSnapshot[]
  }
}

export type PlannedEntity = {
  action: "create" | "update" | "none"
  id?: string
}

export type CommercialBootstrapPlan = {
  region: PlannedEntity
  salesChannel: PlannedEntity
  store: PlannedEntity
}

const hasBootstrapKey = (metadata: Metadata): boolean =>
  metadata?.commercial_defaults_key === COMMERCIAL_DEFAULTS.bootstrapKey

const selectUnique = <T>(items: T[], label: string): T | undefined => {
  if (items.length > 1) {
    throw new Error(`Multiple ${label} records match the Brazil defaults.`)
  }

  return items[0]
}

const normalize = (value: string): string => value.trim().toLowerCase()

const MEDUSA_DEFAULT_STORE_NAME = "Medusa Store"
const MEDUSA_DEFAULT_STORE_RACE_WINDOW_MS = 10_000

const hasMetadata = (metadata: Metadata): boolean =>
  Boolean(metadata && Object.keys(metadata).length)

const isPristineMedusaDefaultStore = (store: StoreSnapshot): boolean =>
  store.name === MEDUSA_DEFAULT_STORE_NAME &&
  Boolean(store.default_sales_channel_id) &&
  !store.default_region_id &&
  !store.default_location_id &&
  !hasMetadata(store.metadata) &&
  (store.supported_locales?.length ?? 0) === 0

const currencySignature = (store: StoreSnapshot): string =>
  JSON.stringify(
    [...(store.supported_currencies ?? [])]
      .map((currency) => ({
        currency_code: normalize(currency.currency_code),
        is_default: currency.is_default,
        is_tax_inclusive: currency.is_tax_inclusive
      }))
      .sort((left, right) =>
        left.currency_code.localeCompare(right.currency_code)
      )
  )

export const getRedundantMedusaDefaultStoreIds = (
  stores: StoreSnapshot[]
): string[] => {
  if (
    stores.length < 2 ||
    stores.some((store) => !isPristineMedusaDefaultStore(store))
  ) {
    return []
  }

  const salesChannelIds = new Set(
    stores.map((store) => store.default_sales_channel_id)
  )
  const currencySignatures = new Set(stores.map(currencySignature))
  const orderedStores = [...stores].sort((left, right) => {
    const leftCreatedAt = Date.parse(String(left.created_at ?? ""))
    const rightCreatedAt = Date.parse(String(right.created_at ?? ""))

    if (Number.isNaN(leftCreatedAt) || Number.isNaN(rightCreatedAt)) {
      return left.id.localeCompare(right.id)
    }

    return leftCreatedAt - rightCreatedAt || left.id.localeCompare(right.id)
  })
  const createdAtValues = orderedStores.map((store) =>
    Date.parse(String(store.created_at ?? ""))
  )

  if (
    salesChannelIds.size !== 1 ||
    currencySignatures.size !== 1 ||
    createdAtValues.some(Number.isNaN) ||
    createdAtValues.at(-1)! - createdAtValues[0] >
      MEDUSA_DEFAULT_STORE_RACE_WINDOW_MS
  ) {
    return []
  }

  return orderedStores.slice(1).map((store) => store.id)
}

export const mergeRegionCountryCodes = (
  countries: RegionSnapshot["countries"]
): string[] => {
  const codes = new Set(
    (countries ?? []).map((country) => normalize(country.iso_2))
  )
  codes.add(COMMERCIAL_DEFAULTS.countryCode)
  return [...codes]
}

export const mergeSupportedCurrencies = (
  currencies: StoreSnapshot["supported_currencies"]
): NonNullable<StoreSnapshot["supported_currencies"]> => {
  const merged = new Map<
    string,
    NonNullable<StoreSnapshot["supported_currencies"]>[number]
  >()

  for (const currency of currencies ?? []) {
    const currencyCode = normalize(currency.currency_code)
    merged.set(currencyCode, {
      currency_code: currencyCode,
      is_default: currencyCode === COMMERCIAL_DEFAULTS.currencyCode,
      ...(currency.is_tax_inclusive === undefined
        ? {}
        : { is_tax_inclusive: currency.is_tax_inclusive })
    })
  }

  if (!merged.has(COMMERCIAL_DEFAULTS.currencyCode)) {
    merged.set(COMMERCIAL_DEFAULTS.currencyCode, {
      currency_code: COMMERCIAL_DEFAULTS.currencyCode,
      is_default: true
    })
  }

  return [...merged.values()].sort((left, right) =>
    left.currency_code === COMMERCIAL_DEFAULTS.currencyCode
      ? -1
      : right.currency_code === COMMERCIAL_DEFAULTS.currencyCode
        ? 1
        : left.currency_code.localeCompare(right.currency_code)
  )
}

export const mergeSupportedLocales = (
  locales: StoreSnapshot["supported_locales"]
): NonNullable<StoreSnapshot["supported_locales"]> => {
  const localeCodes = new Set(
    (locales ?? []).map((locale) => locale.locale_code.trim())
  )
  localeCodes.add(COMMERCIAL_DEFAULTS.localeCode)
  return [...localeCodes].sort().map((locale_code) => ({ locale_code }))
}

export const validateCommercialDefaults = (
  defaults: typeof COMMERCIAL_DEFAULTS = COMMERCIAL_DEFAULTS
): void => {
  if (defaults.countryCode !== "br") {
    throw new Error('Commercial country must be "br".')
  }

  if (defaults.currencyCode !== "brl") {
    throw new Error('Commercial currency must be "brl".')
  }

  if (defaults.localeCode !== "pt-BR") {
    throw new Error('Commercial locale must be "pt-BR".')
  }

  if (defaults.regionName !== "Brasil") {
    throw new Error('Commercial region must be "Brasil".')
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (!value.trim()) {
      throw new Error(`Commercial default ${key} cannot be empty.`)
    }
  }
}

export const resolveDefaultStore = (
  stores: StoreSnapshot[]
): StoreSnapshot | undefined => {
  const keyedStore = selectUnique(
    stores.filter((store) => hasBootstrapKey(store.metadata)),
    "stores"
  )

  if (keyedStore) {
    return keyedStore
  }

  if (stores.length > 1) {
    throw new Error(
      "Multiple stores exist and none has the commercial defaults key."
    )
  }

  return stores[0]
}

export const resolveBrazilRegion = (
  regions: RegionSnapshot[]
): RegionSnapshot | undefined => {
  const keyedRegion = selectUnique(
    regions.filter((region) => hasBootstrapKey(region.metadata)),
    "regions"
  )
  const countryRegion = selectUnique(
    regions.filter((region) =>
      region.countries?.some(
        (country) =>
          normalize(country.iso_2) === COMMERCIAL_DEFAULTS.countryCode
      )
    ),
    "regions containing country br"
  )
  const namedRegion = selectUnique(
    regions.filter(
      (region) =>
        normalize(region.name) === normalize(COMMERCIAL_DEFAULTS.regionName)
    ),
    'regions named "Brasil"'
  )

  const matches = [keyedRegion, countryRegion, namedRegion].filter(
    (region): region is RegionSnapshot => Boolean(region)
  )
  const distinctIds = new Set(matches.map((region) => region.id))

  if (distinctIds.size > 1) {
    throw new Error(
      "Conflicting region records match the Brazil commercial defaults."
    )
  }

  return matches[0]
}

export const resolveDefaultSalesChannel = (
  salesChannels: SalesChannelSnapshot[],
  store?: StoreSnapshot
): SalesChannelSnapshot | undefined => {
  let currentDefault: SalesChannelSnapshot | undefined

  if (store?.default_sales_channel_id) {
    currentDefault = salesChannels.find(
      (salesChannel) => salesChannel.id === store.default_sales_channel_id
    )

    if (!currentDefault) {
      throw new Error("The store default sales channel could not be resolved.")
    }
  }

  const keyedChannel = selectUnique(
    salesChannels.filter((salesChannel) =>
      hasBootstrapKey(salesChannel.metadata)
    ),
    "sales channels"
  )

  const namedChannel = selectUnique(
    salesChannels.filter(
      (salesChannel) =>
        normalize(salesChannel.name) ===
        normalize(COMMERCIAL_DEFAULTS.salesChannelName)
    ),
    'sales channels named "Canal Brasil"'
  )

  const matches = [currentDefault, keyedChannel, namedChannel].filter(
    (salesChannel): salesChannel is SalesChannelSnapshot =>
      Boolean(salesChannel)
  )
  const distinctIds = new Set(matches.map((salesChannel) => salesChannel.id))

  if (distinctIds.size > 1) {
    throw new Error(
      "Conflicting sales channels match the Brazil commercial defaults."
    )
  }

  return matches[0]
}

const containsBrazil = (region: RegionSnapshot): boolean =>
  region.countries?.some(
    (country) => normalize(country.iso_2) === COMMERCIAL_DEFAULTS.countryCode
  ) === true

const regionIsCurrent = (region: RegionSnapshot): boolean =>
  region.name === COMMERCIAL_DEFAULTS.regionName &&
  normalize(region.currency_code) === COMMERCIAL_DEFAULTS.currencyCode &&
  containsBrazil(region) &&
  hasBootstrapKey(region.metadata)

const salesChannelIsCurrent = (salesChannel: SalesChannelSnapshot): boolean =>
  salesChannel.name === COMMERCIAL_DEFAULTS.salesChannelName &&
  salesChannel.is_disabled === false &&
  hasBootstrapKey(salesChannel.metadata)

const storeIsCurrent = (
  store: StoreSnapshot,
  region: PlannedEntity,
  salesChannel: PlannedEntity
): boolean => {
  if (!region.id || !salesChannel.id) {
    return false
  }

  const currencies = store.supported_currencies ?? []
  const locales = store.supported_locales ?? []
  const brazilCurrencies = currencies.filter(
    (currency) =>
      normalize(currency.currency_code) === COMMERCIAL_DEFAULTS.currencyCode
  )

  return (
    store.name === COMMERCIAL_DEFAULTS.storeName &&
    store.default_region_id === region.id &&
    store.default_sales_channel_id === salesChannel.id &&
    brazilCurrencies.length === 1 &&
    brazilCurrencies[0].is_default === true &&
    currencies.every(
      (currency) =>
        normalize(currency.currency_code) ===
          COMMERCIAL_DEFAULTS.currencyCode || currency.is_default === false
    ) &&
    locales.some(
      (locale) => locale.locale_code === COMMERCIAL_DEFAULTS.localeCode
    ) &&
    hasBootstrapKey(store.metadata)
  )
}

export const buildCommercialBootstrapPlan = (
  state: CommercialState
): CommercialBootstrapPlan => {
  validateCommercialDefaults()

  const store = resolveDefaultStore(state.stores)
  const region = resolveBrazilRegion(state.regions)
  const salesChannel = resolveDefaultSalesChannel(state.salesChannels, store)

  const regionPlan: PlannedEntity = region
    ? { action: regionIsCurrent(region) ? "none" : "update", id: region.id }
    : { action: "create" }
  const salesChannelPlan: PlannedEntity = salesChannel
    ? {
        action: salesChannelIsCurrent(salesChannel) ? "none" : "update",
        id: salesChannel.id
      }
    : { action: "create" }
  const storePlan: PlannedEntity = store
    ? {
        action: storeIsCurrent(store, regionPlan, salesChannelPlan)
          ? "none"
          : "update",
        id: store.id
      }
    : { action: "create" }

  return {
    region: regionPlan,
    salesChannel: salesChannelPlan,
    store: storePlan
  }
}

export const withCommercialDefaultsKey = (
  metadata: Metadata
): Record<string, unknown> => ({
  ...(metadata ?? {}),
  commercial_defaults_key: COMMERCIAL_DEFAULTS.bootstrapKey
})
