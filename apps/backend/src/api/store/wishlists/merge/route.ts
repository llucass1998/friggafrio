import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {
  addWishlistProduct,
  assertProductsExist,
  getOrCreatePrimaryWishlist,
  normalizeProductIds,
  requireCustomerId,
  serializeWishlist,
  wishlistServiceFor,
} from "../wishlist"

const mergeWishlistSchema = z.object({
  product_ids: z.array(z.string().trim().min(1).max(255)).max(100),
}).strict()

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const customerId = requireCustomerId(req)
  const parsed = mergeWishlistSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid wishlist merge" })
  }

  const productIds = normalizeProductIds(parsed.data.product_ids)
  await assertProductsExist(req, productIds)
  const service = wishlistServiceFor(req)
  const wishlist = await getOrCreatePrimaryWishlist(service, customerId)
  for (const productId of productIds) {
    await addWishlistProduct(service, wishlist.id, productId)
  }

  return res.json(await serializeWishlist(service, wishlist))
}
