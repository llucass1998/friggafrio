import { sdk } from "@/lib/medusa"

export type ProductReviewSummary = {
  average: number | null
  total: number
}

type ProductReviewSummariesResponse = {
  summaries: Record<string, ProductReviewSummary>
}

export const getProductReviewSummaries = async (productIds: readonly string[]) => {
  const ids = Array.from(new Set(productIds.filter(Boolean))).slice(0, 60)
  if (ids.length === 0) return {} as Record<string, ProductReviewSummary>
  const response = await sdk.client.fetch<ProductReviewSummariesResponse>("/store/product-reviews/summaries", {
    method: "GET",
    query: { product_ids: ids.join(",") },
  })
  return response.summaries
}
