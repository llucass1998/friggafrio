import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { validateCartCommercialEligibility } from "../../utils/cart-commercial-eligibility"
import type { CommercialLine } from "../../utils/cart-commercial-eligibility"

/** Revalidates persisted cart lines before any checkout/payment transition. */
export async function validateDemoPriceCheckout(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const cartId = req.params.id

  if (!cartId) return next()

  try {
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "items.id",
        "items.quantity",
        "items.unit_price",
        "items.metadata",
        "items.variant.inventory_quantity",
        "items.variant.manage_inventory",
        "items.variant.allow_backorder",
        "items.variant.metadata",
        "items.variant.product.metadata",
      ],
      filters: { id: cartId },
    })

    const cart = carts[0] as { items?: CommercialLine[] } | undefined
    if (!cart?.items) return next()

    const eligibility = validateCartCommercialEligibility(cart.items)
    if (!eligibility.eligible) {
      const firstBlock = eligibility.blockingLines[0]
      return res.status(400).json({
        type: "invalid_data",
        message: "Cart contains items that cannot proceed to checkout.",
        code: firstBlock?.reason === "QUOTE_ONLY" ? "product_quote_only" : "product_commercial_hold",
        blocking_lines: eligibility.blockingLines.map(({ lineId, reason }) => ({ line_id: lineId, reason })),
      })
    }

    return next()
  } catch (err) {
    return next(err)
  }
}
