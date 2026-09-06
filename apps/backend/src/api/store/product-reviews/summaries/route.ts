import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import type ProductReviewService from "../../../../modules/product-review/service"
import { ProductReviewStatus } from "../../../../modules/product-review/models/product-review"

type ReviewRecord = {
  product_id: string
  rating: number
}

type ReviewService = ProductReviewService & {
  listProductReviews: (filters: Record<string, unknown>) => Promise<ReviewRecord[]>
}

const MAX_PRODUCT_IDS = 60

const productIdsFrom = (value: unknown): string[] => {
  if (typeof value !== "string") return []
  return [...new Set(value.split(",").map((id) => id.trim()).filter(Boolean))].slice(0, MAX_PRODUCT_IDS)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productIds = productIdsFrom(req.query.product_ids)
  if (productIds.length === 0) return res.json({ summaries: {} })

  const service = req.scope.resolve(PRODUCT_REVIEW_MODULE) as ReviewService
  const reviews = await service.listProductReviews({
    product_id: productIds,
    status: ProductReviewStatus.APPROVED,
  })

  const totals = new Map(productIds.map((id) => [id, { total: 0, sum: 0 }]))
  for (const review of reviews) {
    const summary = totals.get(review.product_id)
    if (!summary) continue
    summary.total += 1
    summary.sum += review.rating
  }

  const summaries = Object.fromEntries([...totals.entries()].map(([productId, summary]) => [productId, {
    total: summary.total,
    average: summary.total > 0 ? Number((summary.sum / summary.total).toFixed(1)) : null,
  }]))
  return res.json({ summaries })
}
