import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function paymentWebhookReceivedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ payload: Record<string, unknown> }>) {
  const logger = container.resolve("logger")

  logger.info(`[Payment] Webhook Received asynchronously for payload processing`)

  // Here we would safely invoke a workflow to reconcile the payment via the Provider
  // and then mutate the Order status
}

export const config: SubscriberConfig = {
  event: "mercado-pago.webhook.received",
}
