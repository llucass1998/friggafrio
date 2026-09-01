import type { AuthenticatedMedusaRequest, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import type ProductReviewService from "../../../../../modules/product-review/service"
import { ProductReviewStatus } from "../../../../../modules/product-review/models/product-review"

export const reviewInputSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().default(""),
  body: z.string().trim().min(10).max(5000),
}).strict()

type ReviewRecord = {
  id: string
  product_id: string
  customer_id: string
  order_id?: string | null
  author_name: string
  rating: number
  title?: string | null
  body: string
  verified_purchase: boolean
  status: ProductReviewStatus
  admin_reply?: string | null
  created_at: string | Date
}

type ReviewService = ProductReviewService & {
  listProductReviews: (filters: Record<string, unknown>) => Promise<ReviewRecord[]>
  listAndCountProductReviews: (filters: Record<string, unknown>, config: Record<string, unknown>) => Promise<[ReviewRecord[], number]>
  createProductReviews: (input: Record<string, unknown>) => Promise<ReviewRecord>
  updateProductReviews: (input: Record<string, unknown>) => Promise<ReviewRecord>
}

export const getProductId = (req: MedusaRequest): string => {
  const productId = String(req.params.productId || "").trim()
  if (!productId) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Product is required")
  return productId
}

export const reviewServiceFor = (req: MedusaRequest): ReviewService =>
  req.scope.resolve(PRODUCT_REVIEW_MODULE) as ReviewService

export const serializeReview = (review: ReviewRecord) => ({
  id: review.id,
  author_name: review.author_name,
  rating: review.rating,
  title: review.title || null,
  body: review.body,
  verified_purchase: review.verified_purchase,
  created_at: review.created_at,
})

export const customerIdFrom = (req: AuthenticatedMedusaRequest): string => {
  const customerId = req.auth_context?.actor_id
  if (!customerId) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Authentication required")
  return customerId
}

export const productExists = async (req: MedusaRequest, productId: string): Promise<boolean> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id"],
    filters: { id: productId },
  })
  return data.length > 0
}

const eligibleOrderFor = async (req: AuthenticatedMedusaRequest, productId: string, customerId: string): Promise<{ id: string } | undefined> => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "status", "fulfillment_status", "items.product_id", "items.variant.product_id"],
    filters: { customer_id: customerId },
    pagination: { skip: 0, take: 1000 },
  })

  return (data as Array<{
    id: string
    customer_id?: string
    status?: string
    fulfillment_status?: string
    items?: Array<{ product_id?: string; variant?: { product_id?: string } }>
  }>).find((order) => {
    const fulfillment = String(order.fulfillment_status || "").toLowerCase()
    const delivered = fulfillment === "fulfilled" || fulfillment === "delivered"
    const ownsProduct = order.items?.some((item) => item.product_id === productId || item.variant?.product_id === productId)
    return order.customer_id === customerId && delivered && ownsProduct
  })
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const productId = getProductId(req)
  const service = reviewServiceFor(req)
  const sort = String(req.query.sort || "recent")
  const ratingValue = req.query.rating ? Number(req.query.rating) : undefined
  const verified = req.query.verified === "true"
  const pageValue = Number(req.query.page || 1)
  const limitValue = Number(req.query.limit || 10)
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1
  const limit = Number.isSafeInteger(limitValue) ? Math.min(10, Math.max(1, limitValue)) : 10
  const allowedSort = new Set(["recent", "oldest", "rating_high", "rating_low"])
  const normalizedSort = allowedSort.has(sort) ? sort : "recent"
  const filters: Record<string, unknown> = { product_id: productId, status: ProductReviewStatus.APPROVED }
  if (ratingValue !== undefined && Number.isInteger(ratingValue) && ratingValue >= 1 && ratingValue <= 5) filters.rating = ratingValue
  if (verified) filters.verified_purchase = true
  const order = normalizedSort === "oldest"
    ? { created_at: "ASC" }
    : normalizedSort === "rating_high"
      ? { rating: "DESC", created_at: "DESC" }
      : normalizedSort === "rating_low"
        ? { rating: "ASC", created_at: "DESC" }
        : { created_at: "DESC" }

  const [reviews, count] = await service.listAndCountProductReviews(filters, {
    skip: (page - 1) * limit,
    take: limit,
    order,
  })
  const published = await service.listProductReviews({ product_id: productId, status: ProductReviewStatus.APPROVED })
  const distribution = [5, 4, 3, 2, 1].reduce<Record<string, number>>((result, star) => {
    result[String(star)] = published.filter((review) => review.rating === star).length
    return result
  }, {})
  const total = published.length
  const average = total > 0 ? Number((published.reduce((sum, review) => sum + review.rating, 0) / total).toFixed(1)) : null

  res.json({
    reviews: reviews.map(serializeReview),
    count,
    page,
    limit,
    summary: { average, total, distribution },
  })
}

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = getProductId(req)
  const customerId = customerIdFrom(req)
  if (!(await productExists(req, productId))) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  const parsed = reviewInputSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: "Invalid review" })

  const service = reviewServiceFor(req)
  const existing = await service.listProductReviews({ customer_id: customerId, product_id: productId })
  if (existing.length > 0) return res.status(409).json({ message: "You have already reviewed this product" })
  const order = await eligibleOrderFor(req, productId, customerId)
  if (!order) return res.status(403).json({ message: "You may review this product after an eligible purchase" })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "first_name", "last_name"],
    filters: { id: customerId },
  })
  const customer = customers[0] as { first_name?: string; last_name?: string } | undefined
  const firstName = customer?.first_name?.trim() || "Cliente"
  const lastInitial = customer?.last_name?.trim().charAt(0)
  const authorName = lastInitial ? `${firstName} ${lastInitial}.` : firstName
  const created = await service.createProductReviews({
    product_id: productId,
    customer_id: customerId,
    order_id: order.id,
    author_name: authorName.slice(0, 120),
    rating: parsed.data.rating,
    title: parsed.data.title || null,
    body: parsed.data.body,
    verified_purchase: true,
    status: ProductReviewStatus.PENDING,
  })

  res.status(201).json({ review: { ...serializeReview(created), status: ProductReviewStatus.PENDING } })
}

export const reviewEligibility = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const productId = getProductId(req)
  const customerId = customerIdFrom(req)
  if (!(await productExists(req, productId))) throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product not found")
  const service = reviewServiceFor(req)
  const existing = await service.listProductReviews({ customer_id: customerId, product_id: productId })
  const order = existing.length === 0 ? await eligibleOrderFor(req, productId, customerId) : undefined
  const ownReview = existing[0]
  res.json({
    eligible: Boolean(order),
    already_reviewed: existing.length > 0,
    review: ownReview
      ? {
          id: ownReview.id,
          rating: ownReview.rating,
          title: ownReview.title || null,
          body: ownReview.body,
          status: ownReview.status,
        }
      : null,
  })
}
