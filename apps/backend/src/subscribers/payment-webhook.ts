import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function paymentWebhookReceivedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ payload: unknown }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  logger.info(`[Payment] Webhook Received asynchronously for payload processing`)

  // Here we would safely invoke a workflow to reconcile the payment via the Provider
  // and then mutate the Order status
}

export const config: SubscriberConfig = {
  event: "mercado-pago.webhook.received",
}
