import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PRODUCT_REVIEW_MODULE } from "../../../../../modules/product-review"
import { ProductReviewStatus } from "../../../../../modules/product-review/models/product-review"
import { GET, POST, reviewEligibility } from "./route"
import { PATCH as PATCH_REVIEW } from "./[reviewId]/route"

const response = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

const fixture = ({ eligible = true, existing = false } = {}) => {
  const reviews = existing ? [{ id: "review_existing", customer_id: "customer_a", product_id: "prod_1", rating: 5 }] : []
  const service = {
    listProductReviews: jest.fn(async (filters: Record<string, unknown>) => {
      if (filters.status === ProductReviewStatus.APPROVED) return reviews.filter((review) => review.product_id === filters.product_id)
      return reviews.filter((review) => review.customer_id === filters.customer_id && review.product_id === filters.product_id)
    }),
    listAndCountProductReviews: jest.fn(async () => [reviews, reviews.length] as const),
    createProductReviews: jest.fn(async (input: Record<string, unknown>) => ({ id: "review_new", created_at: new Date().toISOString(), ...input })),
    updateProductReviews: jest.fn(async (input: Record<string, unknown>) => ({ id: "review_existing", created_at: new Date().toISOString(), ...input, product_id: "prod_1", customer_id: "customer_a", verified_purchase: true, author_name: "Lucas S." })),
  }
  const query = {
    graph: jest.fn(async ({ entity }: { entity: string }) => {
      if (entity === "product") return { data: [{ id: "prod_1" }] }
      if (entity === "order") return { data: eligible ? [{ id: "order_1", customer_id: "customer_a", fulfillment_status: "fulfilled", items: [{ product_id: "prod_1" }] }] : [] }
      if (entity === "customer") return { data: [{ id: "customer_a", first_name: "Lucas", last_name: "Silva" }] }
      return { data: [] }
    }),
  }
  const request = (body?: unknown) => ({
    body,
    params: { productId: "prod_1", reviewId: "" },
    query: { sort: "recent", page: "1", limit: "10" } as Record<string, string>,
    auth_context: { actor_id: "customer_a" },
    scope: { resolve: (key: unknown) => key === PRODUCT_REVIEW_MODULE ? service : key === ContainerRegistrationKeys.QUERY ? query : undefined },
  })
  return { service, query, request }
}

describe("product review routes", () => {
  it("returns real summary and applies server-side filters before pagination", async () => {
    const { service, request } = fixture()
    const req = request()
    req.query = { sort: "rating_high", rating: "5", verified: "true", page: "2", limit: "10" }
    await GET(req as never, response() as never)
    expect(service.listAndCountProductReviews).toHaveBeenCalledWith(
      expect.objectContaining({ status: ProductReviewStatus.APPROVED, product_id: "prod_1", rating: 5, verified_purchase: true }),
      expect.objectContaining({ skip: 10, take: 10, order: { rating: "DESC", created_at: "DESC" }}),
    )
  })

  it("rejects invalid ratings and does not create a review", async () => {
    const { service, request } = fixture()
    const res = response()
    await POST(request({ rating: 6, title: "Bad", body: "This should not be accepted" }) as never, res as never)
    expect(res.statusCode).toBe(400)
    expect(service.createProductReviews).not.toHaveBeenCalled()
  })

  it("denies a customer without an eligible fulfilled order", async () => {
    const { service, request } = fixture({ eligible: false })
    const res = response()
    await POST(request({ rating: 5, title: "Great", body: "This review is long enough" }) as never, res as never)
    expect(res.statusCode).toBe(403)
    expect(service.createProductReviews).not.toHaveBeenCalled()
  })

  it("creates a pending verified review from auth and order context", async () => {
    const { service, request } = fixture()
    const res = response()
    await POST(request({ rating: 5, title: "Great", body: "This review is long enough" }) as never, res as never)
    expect(res.statusCode).toBe(201)
    expect(service.createProductReviews).toHaveBeenCalledWith(expect.objectContaining({
      customer_id: "customer_a",
      product_id: "prod_1",
      order_id: "order_1",
      verified_purchase: true,
      status: ProductReviewStatus.PENDING,
      author_name: "Lucas S.",
    }))
  })

  it("prevents a second review for the same customer and product", async () => {
    const { service, request } = fixture({ existing: true })
    const res = response()
    await POST(request({ rating: 5, title: "Again", body: "This duplicate review is long enough" }) as never, res as never)
    expect(res.statusCode).toBe(409)
    expect(service.createProductReviews).not.toHaveBeenCalled()
  })

  it("returns the customer's own review for controlled editing", async () => {
    const { request } = fixture({ existing: true })
    const res = response()
    await reviewEligibility(request() as never, res as never)
    expect(res.body).toEqual(expect.objectContaining({
      already_reviewed: true,
      review: expect.objectContaining({ id: "review_existing", rating: 5 }),
    }))
  })

  it("updates only an owned review and sends it back to moderation", async () => {
    const { service, request } = fixture({ existing: true })
    const req = request({ rating: 4, title: "Atualizado", body: "Texto atualizado com tamanho suficiente" })
    req.params.reviewId = "review_existing"
    const res = response()
    await PATCH_REVIEW(req as never, res as never)
    expect(res.body).toEqual(expect.objectContaining({ review: expect.objectContaining({ status: "pending", rating: 4 }) }))
    expect(service.updateProductReviews).toHaveBeenCalledWith(expect.objectContaining({ id: "review_existing", status: "pending", rating: 4 }))
  })
})
