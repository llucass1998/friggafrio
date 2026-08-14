import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { releaseCartInventoryReservations } from "../../utils/cart-inventory-reservation"

/**
 * A cart mutation invalidates the checkout-ready reservation for that line.
 * The next checkout-ready transition always derives and reserves the current
 * persisted quantity again, preventing an orphaned commitment.
 */
export const releaseCartLineInventoryReservation = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  try {
    const lineItemId = req.params.line_id
    if (lineItemId) {
      await releaseCartInventoryReservations(req.scope, [lineItemId])
    }
    return next()
  } catch (error) {
    return next(error)
  }
}
