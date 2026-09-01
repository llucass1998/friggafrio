import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_REVIEW_MODULE } from "../../../modules/product-review"
import type ProductReviewService from "../../../modules/product-review/service"
import { ProductReviewStatus } from "../../../modules/product-review/models/product-review"

export const statusSchema = z.object({
  status: z.enum([
    ProductReviewStatus.APPROVED,
    ProductReviewStatus.REJECTED,
    ProductReviewStatus.HIDDEN,
  ]),
  admin_reply: z.string().trim().max(2000).nullable().optional(),
}).strict()

export type ReviewService = ProductReviewService & {
  listAndCountProductReviews: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<[unknown[], number]>
  retrieveProductReview: (id: string) => Promise<Record<string, unknown>>
  updateProductReviews: (input: Record<string, unknown>) => Promise<Record<string, unknown>>
}

export const serviceFor = (req: AuthenticatedMedusaRequest): ReviewService =>
  req.scope.resolve(PRODUCT_REVIEW_MODULE) as ReviewService

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = serviceFor(req)
  const status = String(req.query.status || ProductReviewStatus.PENDING)
  const allowed = new Set(Object.values(ProductReviewStatus))
  const filterStatus = allowed.has(status as ProductReviewStatus) ? status : ProductReviewStatus.PENDING
  const limitValue = Number(req.query.limit || 20)
  const offsetValue = Number(req.query.offset || 0)
  const limit = Number.isSafeInteger(limitValue) ? Math.min(100, Math.max(1, limitValue)) : 20
  const offset = Number.isSafeInteger(offsetValue) ? Math.max(0, offsetValue) : 0
  const [reviews, count] = await service.listAndCountProductReviews(
    { status: filterStatus },
    { skip: offset, take: limit, order: { created_at: "DESC" } },
  )
  res.json({ reviews, count, limit, offset })
}
