import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const orderId = data.id

  logger.info(`[Notifications] Handling 'order.placed' event for order: ${orderId}`)

  // Aqui integraríamos com um módulo de notificações (SendGrid, AWS SES, Resend)
  // const notificationModuleService = container.resolve("notificationModuleService")
  // await notificationModuleService.createNotifications({ ... })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
