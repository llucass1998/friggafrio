import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

type EntityEventData = {
  id: string
}

function isEntityEventData(value: unknown): value is EntityEventData {
  if (typeof value !== "object" || value === null) {
    return false
  }
  const record = value as Record<string, unknown>
  return typeof record.id === "string" && record.id.trim().length > 0
}

export default async function customerCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<EntityEventData>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!isEntityEventData(data)) {
    logger.warn(`[Notifications] Handling 'customer.created' failed: Invalid event data structure. Data: ${JSON.stringify(data)}`)
    return
  }

  const customerId = data.id

  logger.info(`[Notifications] Handling 'customer.created' event for customer: ${customerId}`)
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
