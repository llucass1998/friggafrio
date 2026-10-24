import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { dispatchOmieWebhook, pendingOmieWebhooks } from "../integrations/omie/webhook-inbox"

export default async function dispatchPendingOmieWebhooks(container: MedusaContainer) {
  if (!process.env.REDIS_URL || !process.env.OMIE_WEBHOOK_SECRET) return
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  try {
    const eventBus = container.resolve(Modules.EVENT_BUS)
    for (const message of await pendingOmieWebhooks()) await dispatchOmieWebhook(message, eventBus)
  } catch {
    logger.error("[omie-webhook] Recuperação adiada; caixa de entrada preservada")
  }
}

export const config = { name: "omie-webhook-dispatch", schedule: "* * * * *" }
