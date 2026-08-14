import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import {
  reserveCartInventory,
  type CartInventoryLine,
} from "../../../../../utils/cart-inventory-reservation"
import {
  validateCartCommercialEligibility,
  type CommercialLine,
} from "../../../../../utils/cart-commercial-eligibility"

type CartForCheckoutReady = {
  id: string
  sales_channel_id?: string | null
  items?: Array<CartInventoryLine & CommercialLine>
}

/**
 * Gate 6 boundary: a cart is checkout-ready only after commercial eligibility
 * and a real Medusa inventory reservation both succeed.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "sales_channel_id",
      "items.id",
      "items.quantity",
      "items.unit_price",
      "items.metadata",
      "items.variant.id",
      "items.variant.manage_inventory",
      "items.variant.allow_backorder",
      "items.variant.metadata",
      "items.variant.product.metadata",
      "items.variant.inventory_items.inventory_item_id",
      "items.variant.inventory_items.required_quantity",
      "items.variant.inventory_items.inventory.location_levels.location_id",
      "items.variant.inventory_items.inventory.location_levels.stocked_quantity",
      "items.variant.inventory_items.inventory.location_levels.reserved_quantity",
      "items.variant.inventory_items.inventory.location_levels.stock_locations.id",
      "items.variant.inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
    ],
    filters: { id: req.params.id },
  })

  const cart = data[0] as CartForCheckoutReady | undefined
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }

  // Stock derives from the location levels below. Do not let an omitted
  // inventory_quantity projection turn a real inventory-backed cart into a
  // false MISSING_INVENTORY commercial failure before Medusa can reserve it.
  const eligibility = validateCartCommercialEligibility(cart.items ?? [], {
    deferInventoryValidation: true,
  })
  if (!eligibility.checkoutReady) {
    return res.status(400).json({
      checkout_ready: false,
      code: "cart_commercial_hold",
      blocking_lines: eligibility.blockingLines.map(({ lineId, reason }) => ({
        line_id: lineId,
        reason,
      })),
    })
  }

  const reservations = await reserveCartInventory(
    req.scope,
    cart.items ?? [],
    cart.sales_channel_id,
  )

  return res.status(200).json({
    checkout_ready: true,
    reservation_count: reservations.length,
  })
}
