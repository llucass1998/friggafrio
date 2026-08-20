import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {
  addWishlistProduct,
  assertProductsExist,
  getOrCreatePrimaryWishlist,
  requireCustomerId,
  serializeWishlist,
  wishlistServiceFor,
} from "../wishlist"

const addWishlistItemSchema = z.object({
  product_id: z.string().trim().min(1).max(255),
}).strict()

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const customerId = requireCustomerId(req)
  const parsed = addWishlistItemSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid wishlist item" })
  }

  await assertProductsExist(req, [parsed.data.product_id])
  const service = wishlistServiceFor(req)
  const wishlist = await getOrCreatePrimaryWishlist(service, customerId)
  await addWishlistProduct(service, wishlist.id, parsed.data.product_id)

  return res.json(await serializeWishlist(service, wishlist))
}
