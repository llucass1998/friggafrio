import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"
import { reorderWorkflow } from "../../../../../../../workflows/reorder"
import {
  reserveCartInventory,
  type CartInventoryLine,
} from "../../../../../../../utils/cart-inventory-reservation"
import {
  validateCartCommercialEligibility,
  type CommercialLine,
} from "../../../../../../../utils/cart-commercial-eligibility"

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "status", "payment_status", "items.id"],
    filters: { id },
  })
  const order = orders[0] as {
    id: string
    customer_id?: string | null
    status?: string | null
    payment_status?: string | null
  } | undefined

  if (!order) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Order not found")
  }
  if (order.customer_id !== customerId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "You don't have access to this order",
    )
  }

  const blockedStates = new Set(["draft", "pending", "canceled", "archived"])
  if (blockedStates.has(String(order.status ?? "").toLowerCase())) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Only a completed order can be reordered",
    )
  }
  if (String(order.payment_status ?? "").toLowerCase() === "canceled") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Orders with canceled payment cannot be reordered",
    )
  }

  const { result } = await reorderWorkflow(req.scope).run({
    input: {
      order_id: id,
    },
  })

  const cartId = (result as { id?: string } | undefined)?.id
  if (!cartId) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Reorder cart was not created")
  }

  try {
    // Repricing is the authoritative Medusa boundary; historical order prices
    // are never trusted for a new cart.
    await refreshCartItemsWorkflow(req.scope).run({
      input: { cart_id: cartId, force_refresh: true, force_tax_calculation: true },
    })

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "*",
        "items.*",
        "items.variant.id",
        "items.variant.manage_inventory",
        "items.variant.allow_backorder",
        "items.variant.inventory_items.inventory_item_id",
        "items.variant.inventory_items.required_quantity",
        "items.variant.inventory_items.inventory.location_levels.location_id",
        "items.variant.inventory_items.inventory.location_levels.stocked_quantity",
        "items.variant.inventory_items.inventory.location_levels.reserved_quantity",
        "items.variant.inventory_items.inventory.location_levels.stock_locations.id",
        "items.variant.inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
        "items.variant.metadata",
        "items.variant.product.metadata",
      ],
      filters: { id: cartId },
    })
    const cart = carts[0] as {
      sales_channel_id?: string | null
      items?: Array<CartInventoryLine & CommercialLine>
    } | undefined
    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Reorder cart not found")
    }

    const eligibility = validateCartCommercialEligibility(cart.items ?? [], {
      deferInventoryValidation: true,
    })
    if (!eligibility.checkoutReady) {
      const reason = eligibility.blockingLines[0]?.reason ?? "INVALID_REORDER_ITEM"
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Order cannot be reordered: ${reason}`,
      )
    }

    // The reservation workflow is the locking-backed inventory check. The
    // checkout preparation boundary can safely reuse these reservations.
    await reserveCartInventory(req.scope, (cart.items ?? []) as CartInventoryLine[], cart.sales_channel_id)

    const { data: refreshedCarts } = await query.graph({
      entity: "cart",
      fields: ["*", "items.*", "shipping_methods.*", "shipping_address.*", "billing_address.*"],
      filters: { id: cartId },
    })
    return res.json({ cart: refreshedCarts[0] })
  } catch (error) {
    try {
      await (req.scope.resolve(Modules.CART) as { deleteCarts: (ids: string[]) => Promise<void> }).deleteCarts([cartId])
    } catch {
      // Preserve the original validation failure if cleanup is unavailable.
    }
    throw error
  }
}
