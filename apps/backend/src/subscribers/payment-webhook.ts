import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

type WebhookEventData = {
  payload: unknown
}

function isWebhookEventData(value: unknown): value is WebhookEventData {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return "payload" in record && record.payload !== undefined
}

export default async function paymentWebhookReceivedHandler({
  event: { data },
  container,
}: SubscriberArgs<WebhookEventData>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!isWebhookEventData(data)) {
    logger.warn(`[Payment] Webhook Received failed: Invalid event data structure. Data: ${JSON.stringify(data)}`)
    return
  }

  logger.info(`[Payment] Webhook Received asynchronously for payload processing`)

  // Here we would safely invoke a workflow to reconcile the payment via the Provider
  // and then mutate the Order status
}

export const config: SubscriberConfig = {
  event: "mercado-pago.webhook.received",
}
