import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  CHECKOUT_PREPARATION_METADATA_KEY,
  checkoutSnapshotFromCart,
  isAuthenticCheckoutPreparationMarker,
  stableCheckoutHash,
} from "../../../../../utils/checkout-preparation"

/**
 * Legacy compatibility endpoint. Inventory reservation and readiness now live
 * exclusively in /prepare; this route can only acknowledge an already-signed
 * marker and never creates a reservation on its own.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
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
    filters: { id: req.params.id },
  })

  const cart = data[0] as Record<string, unknown> | undefined
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }
  if (cart.completed_at) {
    return res.status(409).json({
      checkout_ready: false,
      code: "cart_completed",
      message: "Completed carts cannot be prepared again.",
    })
  }
  const actorId = (req as MedusaRequest & { auth_context?: { actor_id?: string } }).auth_context?.actor_id
  if (cart.customer_id && actorId !== cart.customer_id) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Cart does not belong to the authenticated customer")
  }
  if (!cart.customer_id && actorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Guest cart requires its original browser session")
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
