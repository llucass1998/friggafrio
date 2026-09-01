import { MedusaService } from "@medusajs/framework/utils"
import { PaymentOperation } from "./models/payment-operation"

class PaymentOperationService extends MedusaService({ PaymentOperation }) {}
export default PaymentOperationService
