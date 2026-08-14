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

/**
 * Gate 7 must never create an order, even if payment provider flags are
 * accidentally enabled before Gate 8 is opened. Gate 8 explicitly opts in.
 */
export const blockOrderCompletionUntilGate8 = (
  _request: MedusaRequest,
  response: MedusaResponse,
  next: MedusaNextFunction,
) => {
  if (process.env.GATE8_FINALIZATION_ENABLED?.trim().toLowerCase() === "true") {
    return next()
  }

  return sendPaymentUnavailable(response)
}

export const blockUnsafePaymentConfirmation = (
  _request: MedusaRequest,
  response: MedusaResponse
) => sendPaymentUnavailable(response)
