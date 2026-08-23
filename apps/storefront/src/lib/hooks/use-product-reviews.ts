import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  createProductReview,
  getProductReviews,
  getReviewEligibility,
  type ReviewFilter,
  type ReviewSort,
} from "@/lib/data/product-reviews"

export const useProductReviews = (productId: string, options: { sort: ReviewSort; rating: ReviewFilter; verified: boolean; page: number }) =>
  useQuery({
    queryKey: ["product-reviews", productId, options],
    queryFn: () => getProductReviews({ productId, ...options }),
    enabled: Boolean(productId),
  })

export const useReviewEligibility = (productId: string, enabled: boolean) =>
  useQuery({
    queryKey: ["product-review-eligibility", productId],
    queryFn: () => getReviewEligibility(productId),
    enabled: Boolean(productId) && enabled,
    retry: false,
  })

export const useCreateProductReview = (productId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { rating: number; title: string; body: string }) => createProductReview(productId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] })
      queryClient.invalidateQueries({ queryKey: ["product-review-eligibility", productId] })
    },
  })
}
