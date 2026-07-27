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

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<EntityEventData>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (!isEntityEventData(data)) {
    logger.warn(`[Notifications] Handling 'order.placed' failed: Invalid event data structure. Data: ${JSON.stringify(data)}`)
    return
  }

  const orderId = data.id

  logger.info(`[Notifications] Handling 'order.placed' event for order: ${orderId}`)

  // Aqui integraríamos com um módulo de notificações (SendGrid, AWS SES, Resend)
  // const notificationModuleService = container.resolve("notificationModuleService")
  // await notificationModuleService.createNotifications({ ... })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
