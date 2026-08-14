import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ensureCommercialShippingConfiguration } from "../lib/commercial-shipping-bootstrap"

export default async function seedCommercialShippingV1({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const result = await ensureCommercialShippingConfiguration(container)
  logger.info(`[commercial-shipping-v1] ${JSON.stringify(result)}`)
}
