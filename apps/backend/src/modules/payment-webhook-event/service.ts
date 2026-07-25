import { MedusaService } from "@medusajs/framework/utils"
import { PaymentWebhookEvent } from "./models/payment-webhook-event"

class PaymentWebhookEventService extends MedusaService({
  PaymentWebhookEvent,
}) {}

export default PaymentWebhookEventService
