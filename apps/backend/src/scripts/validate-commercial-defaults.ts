import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  COMMERCIAL_DEFAULTS,
  buildCommercialBootstrapPlan,
  readCommercialState,
  type CommercialGraphQuery
} from "../lib/commerce-defaults"

const hasBootstrapKey = (
  metadata: Record<string, unknown> | null | undefined
) => metadata?.commercial_defaults_key === COMMERCIAL_DEFAULTS.bootstrapKey

export default async function validateCommercialDefaults({
  container
}: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(
    ContainerRegistrationKeys.QUERY
  ) as CommercialGraphQuery
  const state = await readCommercialState(query)
  const plan = buildCommercialBootstrapPlan(state)
  const pendingActions = Object.entries(plan).filter(
    ([, entityPlan]) => entityPlan.action !== "none"
  )

  if (pendingActions.length) {
    throw new Error(
      `Commercial defaults are not fully persisted: ${pendingActions
        .map(([entity, entityPlan]) => `${entity}=${entityPlan.action}`)
        .join(" ")}`
    )
  }

  const counts = {
    stores: state.stores.length,
    regions: state.regions.length,
    sales_channels: state.salesChannels.length,
    bootstrap_stores: state.stores.filter((store) =>
      hasBootstrapKey(store.metadata)
    ).length,
    bootstrap_regions: state.regions.filter((region) =>
      hasBootstrapKey(region.metadata)
    ).length,
    bootstrap_sales_channels: state.salesChannels.filter((salesChannel) =>
      hasBootstrapKey(salesChannel.metadata)
    ).length,
    regions_with_br: state.regions.filter((region) =>
      region.countries?.some(
        (country) =>
          country.iso_2.trim().toLowerCase() === COMMERCIAL_DEFAULTS.countryCode
      )
    ).length,
    regions_with_brl: state.regions.filter(
      (region) =>
        region.currency_code.trim().toLowerCase() ===
        COMMERCIAL_DEFAULTS.currencyCode
    ).length
  }

  if (
    counts.bootstrap_stores !== 1 ||
    counts.bootstrap_regions !== 1 ||
    counts.bootstrap_sales_channels !== 1
  ) {
    throw new Error(
      `Commercial bootstrap keys are not unique: ${JSON.stringify(counts)}`
    )
  }

  logger.info(
    `[commercial-seed-validation] ${JSON.stringify({ plan, counts })}`
  )
}
