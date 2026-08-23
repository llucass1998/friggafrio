import { sdk } from "@/lib/medusa"

export type ReviewSort = "recent" | "oldest" | "rating_high" | "rating_low"
export type ReviewFilter = "all" | "5" | "4" | "3" | "2" | "1"

export type ProductReview = {
  id: string
  author_name: string
  rating: number
  title: string | null
  body: string
  verified_purchase: boolean
  created_at: string
}

export type ProductReviewSummary = {
  average: number | null
  total: number
  distribution: Record<string, number>
}

export type ProductReviewsResponse = {
  reviews: ProductReview[]
  count: number
  page: number
  limit: number
  summary: ProductReviewSummary
}

export const getProductReviews = async (input: {
  productId: string
  sort?: ReviewSort
  rating?: ReviewFilter
  verified?: boolean
  page?: number
  limit?: number
}): Promise<ProductReviewsResponse> => {
  const params = new URLSearchParams({
    sort: input.sort || "recent",
    page: String(input.page || 1),
    limit: String(input.limit || 10),
  })
  if (input.rating && input.rating !== "all") params.set("rating", input.rating)
  if (input.verified) params.set("verified", "true")
  return sdk.client.fetch<ProductReviewsResponse>(`/store/products/${input.productId}/reviews?${params.toString()}`)
}

export const getReviewEligibility = async (productId: string) =>
  sdk.client.fetch<{ eligible: boolean; already_reviewed: boolean }>(`/store/products/${productId}/reviews/eligibility`)

export const createProductReview = async (productId: string, input: { rating: number; title: string; body: string }) =>
  sdk.client.fetch<{ review: ProductReview & { status: "pending" } }>(`/store/products/${productId}/reviews`, {
    method: "POST",
    body: input,
  })
