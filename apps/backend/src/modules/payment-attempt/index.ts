import { Module } from "@medusajs/framework/utils"
import PaymentAttemptService from "./service"

export const PAYMENT_ATTEMPT_MODULE = "paymentAttempt"

export default Module(PAYMENT_ATTEMPT_MODULE, {
  service: PaymentAttemptService,
})
