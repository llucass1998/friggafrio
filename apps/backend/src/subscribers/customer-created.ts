import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve("logger")
  const customerId = data.id

  logger.info(`[Notifications] Handling 'customer.created' event for customer: ${customerId}`)
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
