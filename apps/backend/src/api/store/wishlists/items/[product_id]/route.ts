import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import {
  assertProductsExist,
  findPrimaryWishlist,
  requireCustomerId,
  wishlistServiceFor,
} from "../../wishlist"

const productIdSchema = z.string().trim().min(1).max(255)

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
) => {
  const customerId = requireCustomerId(req)
  const parsed = productIdSchema.safeParse(req.params.product_id)
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid wishlist item" })
  }

  await assertProductsExist(req, [parsed.data])
  const service = wishlistServiceFor(req)
  const wishlist = await findPrimaryWishlist(service, customerId)
  if (wishlist) {
    const items = await service.listWishlistItems({
      wishlist_id: wishlist.id,
      product_id: parsed.data,
    })
    if (items.length) {
      await service.deleteWishlistItems([items[0].id])
    }
  }

  // Do not disclose whether this product was in the caller's wishlist.
  return res.status(204).send()
}
