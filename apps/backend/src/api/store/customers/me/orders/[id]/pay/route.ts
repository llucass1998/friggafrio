import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { blockUnsafePaymentConfirmation } from "../../../../../../middlewares/payment-containment"

/**
 * Legacy route retained only as a fail-closed compatibility endpoint.
 *
 * A customer-facing request must never be able to confirm or mutate payment state.
 * Payment confirmation will be reintroduced exclusively through a homologated
 * provider webhook in the gateway phases.
 */
export const POST = (request: MedusaRequest, response: MedusaResponse) =>
  blockUnsafePaymentConfirmation(request, response)
