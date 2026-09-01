import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateRegionsWorkflow } from "@medusajs/medusa/core-flows"
import { COMMERCIAL_DEFAULTS } from "../lib/commerce-defaults"
import {
  isMercadoPagoSandboxEnabled,
  MERCADO_PAGO_PROVIDER_ID,
  mergeRegionPaymentProviders,
} from "../lib/payment-provider-bootstrap"

type RegionRecord = {
  id: string
  name: string
  payment_providers?: Array<{ id?: string }>
}

type Query = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
  }) => Promise<{ data: unknown[] }>
}

type PaymentModule = {
  listPaymentProviders: (filters: { id: string }) => Promise<
    Array<{ id: string; is_enabled: boolean }>
  >
}

/**
 * Links the registered sandbox provider to the single canonical Brazil region.
 * This is intentionally explicit: payment providers remain fail-closed until
 * credentials and both payment flags are present.
 */
export default async function configureMercadoPagoSandbox({
  container,
}: ExecArgs): Promise<void> {
  if (!isMercadoPagoSandboxEnabled()) {
    throw new Error(
      "Mercado Pago sandbox configuration requires MERCADO_PAGO_ENV=sandbox and both payment flags enabled.",
    )
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const payment = container.resolve("payment") as PaymentModule
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const providers = await payment.listPaymentProviders({
    id: MERCADO_PAGO_PROVIDER_ID,
  })
  const provider = providers.find(
    (candidate) => candidate.id === MERCADO_PAGO_PROVIDER_ID,
  )

  if (!provider?.is_enabled) {
    throw new Error("Mercado Pago provider is not registered and enabled.")
  }

  const regionsResult = await query.graph({
    entity: "region",
    fields: ["id", "name", "payment_providers.id"],
    filters: { name: COMMERCIAL_DEFAULTS.regionName },
  })
  const regions = regionsResult.data as RegionRecord[]
  if (regions.length !== 1) {
    throw new Error("Exactly one canonical Brazil region is required.")
  }

  const region = regions[0]
  const existingProviderIds = (region.payment_providers ?? [])
    .map((provider) => provider.id)
    .filter((id): id is string => Boolean(id))
  const paymentProviders = mergeRegionPaymentProviders(existingProviderIds)

  await updateRegionsWorkflow(container).run({
    input: {
      selector: { id: region.id },
      update: { payment_providers: paymentProviders },
    },
  })

  logger.info(
    `[mercado-pago-sandbox] region provider association verified for ${region.name}.`,
  )
}
