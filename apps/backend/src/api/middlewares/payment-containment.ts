import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getPaymentAvailability,
  sendPaymentUnavailable,
} from "../../utils/payment-availability"

export const blockPaymentsWhenDisabled = (
  _request: MedusaRequest,
  response: MedusaResponse,
  next: MedusaNextFunction
) => {
  if (getPaymentAvailability().processingEnabled) {
    return next()
  }

  return sendPaymentUnavailable(response)
}

export const blockUnsafePaymentConfirmation = (
  _request: MedusaRequest,
  response: MedusaResponse
) => sendPaymentUnavailable(response)
