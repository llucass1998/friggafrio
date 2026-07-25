import { MedusaService } from "@medusajs/framework/utils"
import { PaymentAttempt } from "./models/payment-attempt"

class PaymentAttemptService extends MedusaService({
  PaymentAttempt,
}) {}

export default PaymentAttemptService
