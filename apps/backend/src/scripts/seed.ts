import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createStoresWorkflow,
  updateRegionsWorkflow,
  updateSalesChannelsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  COMMERCIAL_DEFAULTS,
  buildCommercialBootstrapPlan,
  mergeRegionCountryCodes,
  mergeSupportedCurrencies,
  mergeSupportedLocales,
  type CommercialState,
  type RegionSnapshot,
  type SalesChannelSnapshot,
  type StoreSnapshot,
  withCommercialDefaultsKey,
} from "../lib/commerce-defaults"

type GraphQuery = {
  graph: (input: {
    entity: string
    fields: string[]
  }) => Promise<{ data: unknown[] }>
}

const readCommercialState = async (query: GraphQuery): Promise<CommercialState> => {
  const [regions, salesChannels, stores] = await Promise.all([
    query.graph({
      entity: "region",
      fields: ["id", "name", "currency_code", "metadata", "countries.iso_2"],
    }),
    query.graph({
      entity: "sales_channel",
      fields: ["id", "name", "description", "is_disabled", "metadata"],
    }),
    query.graph({
      entity: "store",
      fields: [
        "id",
        "name",
        "default_region_id",
        "default_sales_channel_id",
        "metadata",
        "supported_currencies.currency_code",
        "supported_currencies.is_default",
        "supported_currencies.is_tax_inclusive",
        "supported_locales.locale_code",
      ],
    }),
  ])

  return {
    regions: regions.data as RegionSnapshot[],
    salesChannels: salesChannels.data as SalesChannelSnapshot[],
    stores: stores.data as StoreSnapshot[],
  }
}

export default async function seedCommercialDefaults({
  container,
}: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as GraphQuery
  const state = await readCommercialState(query)
  const plan = buildCommercialBootstrapPlan(state)

  logger.info(
    `[commercial-seed] region=${plan.region.action} sales_channel=${plan.salesChannel.action} store=${plan.store.action}`
  )

  const currentRegion = state.regions.find((region) => region.id === plan.region.id)
  let regionId = plan.region.id

  if (plan.region.action === "create") {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: COMMERCIAL_DEFAULTS.regionName,
            currency_code: COMMERCIAL_DEFAULTS.currencyCode,
            countries: [COMMERCIAL_DEFAULTS.countryCode],
            metadata: withCommercialDefaultsKey(undefined),
          },
        ],
      },
    })
    regionId = result[0].id
  } else if (plan.region.action === "update") {
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: plan.region.id },
        update: {
          name: COMMERCIAL_DEFAULTS.regionName,
          currency_code: COMMERCIAL_DEFAULTS.currencyCode,
          countries: mergeRegionCountryCodes(currentRegion?.countries),
          metadata: withCommercialDefaultsKey(currentRegion?.metadata),
        },
      },
    })
  }

  const currentSalesChannel = state.salesChannels.find(
    (salesChannel) => salesChannel.id === plan.salesChannel.id
  )
  let salesChannelId = plan.salesChannel.id

  if (plan.salesChannel.action === "create") {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: COMMERCIAL_DEFAULTS.salesChannelName,
            is_disabled: false,
          },
        ],
      },
    })
    salesChannelId = result[0].id

    await updateSalesChannelsWorkflow(container).run({
      input: {
        selector: { id: salesChannelId },
        update: {
          metadata: withCommercialDefaultsKey(undefined),
        },
      },
    })
  } else if (plan.salesChannel.action === "update") {
    await updateSalesChannelsWorkflow(container).run({
      input: {
        selector: { id: plan.salesChannel.id },
        update: {
          name: COMMERCIAL_DEFAULTS.salesChannelName,
          is_disabled: false,
          metadata: withCommercialDefaultsKey(currentSalesChannel?.metadata),
        },
      },
    })
  }

  if (!regionId || !salesChannelId) {
    throw new Error("Commercial region and sales channel IDs must be resolved.")
  }

  const currentStore = state.stores.find((store) => store.id === plan.store.id)
  const storeData = {
    name: COMMERCIAL_DEFAULTS.storeName,
    default_region_id: regionId,
    default_sales_channel_id: salesChannelId,
    supported_currencies: mergeSupportedCurrencies(
      currentStore?.supported_currencies
    ),
    supported_locales: mergeSupportedLocales(currentStore?.supported_locales),
    metadata: withCommercialDefaultsKey(currentStore?.metadata),
  }

  if (plan.store.action === "create") {
    await createStoresWorkflow(container).run({
      input: { stores: [storeData] },
    })
  } else if (plan.store.action === "update") {
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: plan.store.id },
        update: storeData,
      },
    })
  }

  logger.info(
    `[commercial-seed] complete country=${COMMERCIAL_DEFAULTS.countryCode} currency=${COMMERCIAL_DEFAULTS.currencyCode} locale=${COMMERCIAL_DEFAULTS.localeCode}`
  )
}
