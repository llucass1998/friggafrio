import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  CHECKOUT_PREPARATION_METADATA_KEY,
  checkoutSnapshotFromCart,
  invalidateCheckoutPreparation,
  isAuthenticCheckoutPreparationMarker,
  stableCheckoutHash,
} from "../../utils/checkout-preparation"
import {
  areCartInventoryReservationsValid,
  type CartInventoryLine,
  type ExistingCartInventoryReservation,
} from "../../utils/cart-inventory-reservation"
import { validateCartCommercialEligibility, type CommercialLine } from "../../utils/cart-commercial-eligibility"
import {
  assertCheckoutCartOwnership,
  authenticatedCheckoutCustomerId,
} from "../../utils/checkout-customer-authorization"

/** Commercial cart mutations invalidate READY_FOR_PAYMENT before mutation. */
export const invalidateCartCheckoutPreparation = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const cartId = req.params.id
  if (cartId) await invalidateCheckoutPreparation(req.scope, cartId)
  try {
    return await next()
  } catch (error) {
    console.error("[cart-line-item-mutation]", {
      cartId,
      method: req.method,
      path: req.path,
      error,
    })
    throw error
  }
}

/** Cart completion is only reachable after the server-owned prepare boundary. */
export const requireCheckoutPreparation = async (
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const customerId = authenticatedCheckoutCustomerId(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const result = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "customer_id",
      "completed_at",
      "sales_channel_id",
      "metadata",
      "email",
      "currency_code",
      "shipping_address.*",
      "billing_address.*",
      "items.id",
      "items.quantity",
      "items.unit_price",
      "items.metadata",
      "items.variant.id",
      "items.variant.manage_inventory",
      "items.variant.allow_backorder",
      "items.variant.metadata",
      "items.variant.inventory_items.inventory_item_id",
      "items.variant.inventory_items.required_quantity",
      "items.variant.inventory_items.inventory.location_levels.location_id",
      "items.variant.inventory_items.inventory.location_levels.stock_locations.id",
      "items.variant.inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
      "items.variant.product.metadata",
      "shipping_methods.shipping_option_id",
      "shipping_methods.amount",
      "item_subtotal",
      "tax_total",
      "discount_total",
      "total",
    ],
    filters: { id: req.params.id, customer_id: customerId },
  })
  const cart = result.data[0] as {
    id: string
    customer_id?: unknown
    completed_at?: string | Date | null
    sales_channel_id?: string | null
    metadata?: Record<string, unknown> | null
    items?: Array<Record<string, unknown>>
  } | undefined
  if (!cart) {
    assertCheckoutCartOwnership(customerId, undefined)
  }
  assertCheckoutCartOwnership(customerId, cart?.customer_id)
  const marker = cart?.metadata?.[CHECKOUT_PREPARATION_METADATA_KEY]
  const pickup = cart?.metadata?.frigga_fulfillment_mode === "pickup"
  const snapshot = cart
    ? checkoutSnapshotFromCart((pickup
      ? { ...cart, shipping_address: undefined, allow_missing_shipping_address: true, allow_missing_billing_address: true }
      : cart) as never)
    : null
  if (
    !cart
    || cart.completed_at
    || !isAuthenticCheckoutPreparationMarker(req.params.id, marker)
    || !snapshot
    || stableCheckoutHash(snapshot) !== (marker as { snapshot_hash: string }).snapshot_hash
  ) {
    return res.status(409).json({
      type: "checkout_not_ready",
      code: "checkout_preparation_required",
      message: "Cart must pass server checkout preparation before completion.",
    })
  }

  const items = (cart.items ?? []) as unknown as Array<CartInventoryLine & CommercialLine>
  const commercial = validateCartCommercialEligibility(items, { deferInventoryValidation: true })
  if (!commercial.checkoutReady) {
    return res.status(409).json({
      type: "checkout_not_ready",
      code: "checkout_state_changed",
      message: "Cart commercial lines changed after preparation.",
    })
  }

  const lineItemIds = items.map((item) => item.id).filter((id): id is string => Boolean(id))
  try {
    const inventory = req.scope.resolve(Modules.INVENTORY) as import("@medusajs/types").IInventoryService
    const reservations = lineItemIds.length
      ? await inventory.listReservationItems(
        { line_item_id: lineItemIds },
        { take: Math.max(100, lineItemIds.length * 10) },
      ) as ExistingCartInventoryReservation[]
      : []
    if (!areCartInventoryReservationsValid(items, reservations, cart.sales_channel_id)) {
      return res.status(409).json({
        type: "checkout_not_ready",
        code: "reservation_invalid",
        message: "Cart inventory changed after preparation.",
      })
    }
  } catch {
    return res.status(409).json({
      type: "checkout_not_ready",
      code: "reservation_invalid",
      message: "Cart inventory could not be revalidated.",
    })
  }
  return next()
}
