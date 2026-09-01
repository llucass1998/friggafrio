import { Module } from "@medusajs/framework/utils"
import PaymentOperationService from "./service"

export const PAYMENT_OPERATION_MODULE = "paymentOperation"
export default Module(PAYMENT_OPERATION_MODULE, { service: PaymentOperationService })
