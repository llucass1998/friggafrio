import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  assertCheckoutCartOwnership,
  authenticatedCheckoutCustomerId,
} from "../../utils/checkout-customer-authorization"

/**
 * Resolve the cart through the authenticated customer before any completion
 * gate. Foreign and missing carts share a not-found response.
 */
export const requireOwnedCheckoutCart = async (
  req: MedusaRequest,
  _res: MedusaResponse,
  next: MedusaNextFunction,
) => {
  const customerId = authenticatedCheckoutCustomerId(req)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const result = await query.graph({
    entity: "cart",
    fields: ["id", "customer_id"],
    filters: { id: req.params.id, customer_id: customerId },
  })
  const cart = result.data[0] as { customer_id?: unknown } | undefined

  if (!cart) {
    // Do not reveal whether the cart id belongs to another customer.
    assertCheckoutCartOwnership(customerId, undefined)
  }
  assertCheckoutCartOwnership(customerId, cart?.customer_id)

  return next()
}
