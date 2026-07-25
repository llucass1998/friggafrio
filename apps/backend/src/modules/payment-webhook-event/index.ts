import { Module } from "@medusajs/framework/utils"
import PaymentWebhookEventService from "./service"

export const PAYMENT_WEBHOOK_EVENT_MODULE = "paymentWebhookEvent"

export default Module(PAYMENT_WEBHOOK_EVENT_MODULE, {
  service: PaymentWebhookEventService,
})
