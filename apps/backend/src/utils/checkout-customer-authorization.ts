import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

type CustomerAuthRequest = MedusaRequest & {
  auth_context?: { actor_id?: unknown }
}

/** Reads the customer identity exclusively from Medusa's authenticated context. */
export const authenticatedCheckoutCustomerId = (req: MedusaRequest): string => {
  const actorId = (req as CustomerAuthRequest).auth_context?.actor_id
  if (typeof actorId !== "string" || !actorId.trim()) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Authentication required")
  }

  return actorId
}

/** Use the same not-found result for missing and foreign carts to prevent enumeration. */
export const assertCheckoutCartOwnership = (
  customerId: string,
  cartCustomerId: unknown,
): void => {
  if (typeof cartCustomerId !== "string" || cartCustomerId !== customerId) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }
}
