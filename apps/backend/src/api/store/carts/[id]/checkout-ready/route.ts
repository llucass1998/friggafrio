import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  CHECKOUT_PREPARATION_METADATA_KEY,
  checkoutSnapshotFromCart,
  isAuthenticCheckoutPreparationMarker,
  stableCheckoutHash,
} from "../../../../../utils/checkout-preparation"
import {
  assertCheckoutCartOwnership,
  authenticatedCheckoutCustomerId,
} from "../../../../../utils/checkout-customer-authorization"

/**
 * Legacy compatibility endpoint. Inventory reservation and readiness now live
 * exclusively in /prepare; this route can only acknowledge an already-signed
 * marker and never creates a reservation on its own.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const customerId = authenticatedCheckoutCustomerId(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "completed_at",
      "customer_id",
      "metadata",
      "email",
      "currency_code",
      "shipping_address.*",
      "item_subtotal",
      "tax_total",
      "discount_total",
      "total",
      "items.id",
      "items.quantity",
      "items.unit_price",
      "items.variant.id",
      "shipping_methods.shipping_option_id",
      "shipping_methods.amount",
    ],
    filters: { id: req.params.id, customer_id: customerId },
  })

  const cart = data[0] as Record<string, unknown> | undefined
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }
  assertCheckoutCartOwnership(customerId, cart.customer_id)
  if (cart.completed_at) {
    return res.status(409).json({
      checkout_ready: false,
      code: "cart_completed",
      message: "Completed carts cannot be prepared again.",
    })
  }
  const marker = (cart.metadata as Record<string, unknown> | null | undefined)?.[CHECKOUT_PREPARATION_METADATA_KEY]
  const snapshot = checkoutSnapshotFromCart(cart as never)
  if (!isAuthenticCheckoutPreparationMarker(req.params.id, marker) || !snapshot || stableCheckoutHash(snapshot) !== (marker as { snapshot_hash: string }).snapshot_hash) {
    return res.status(409).json({
      checkout_ready: false,
      code: "checkout_preparation_required",
      message: "Run server checkout preparation before using this legacy endpoint.",
    })
  }

  return res.status(200).json({ checkout_ready: true, reservation_count: 0, deprecated: true })
}
