import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  customerIdFrom,
  getProductId,
  productExists,
  reviewInputSchema,
  reviewServiceFor,
  serializeReview,
} from "../route"

/**
 * A customer may edit only their own review. Edits return to moderation so
 * approved content is never changed without a fresh review of the text.
 */
export const PATCH = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = getProductId(req)
  const reviewId = String(req.params.reviewId || "").trim()
  if (!reviewId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Review is required")
  const customerId = customerIdFrom(req)
  if (!(await productExists(req, productId))) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")

  const parsed = reviewInputSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: "Invalid review" })

  const service = reviewServiceFor(req)
  const ownReviews = await service.listProductReviews({ id: reviewId, product_id: productId, customer_id: customerId })
  const existing = ownReviews[0]
  if (!existing) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Review not found")

  const updated = await service.updateProductReviews({
    id: reviewId,
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    status: "pending",
  })

  res.json({ review: { ...serializeReview(updated as never), status: "pending" } })
}
