import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  findPrimaryWishlist,
  requireCustomerId,
  serializeWishlist,
  wishlistServiceFor,
} from "./wishlist"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const customerId = requireCustomerId(req)
  const service = wishlistServiceFor(req)
  const wishlist = await findPrimaryWishlist(service, customerId)

  return res.json(await serializeWishlist(service, wishlist))
}
