import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge, Button, Text, Select, toast } from "@medusajs/ui"
import { Star } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"

type ReviewStatus = "pending" | "approved" | "rejected" | "hidden"
type Review = {
  id: string
  product_id: string
  author_name: string
  rating: number
  title?: string | null
  body: string
  status: ReviewStatus
  verified_purchase: boolean
  created_at: string
}

type Response = { reviews: Review[]; count: number; limit: number; offset: number }

const statusColor: Record<ReviewStatus, "orange" | "green" | "red" | "grey"> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
  hidden: "grey",
}

const ProductReviewsPage = () => {
  const [status, setStatus] = useState<ReviewStatus>("pending")
  const queryClient = useQueryClient()
  const query = useQuery<Response>({
    queryKey: ["admin-product-reviews", status],
    queryFn: () => sdk.client.fetch<Response>("/admin/product-reviews", { query: { status, limit: 50, offset: 0 } }),
  })
  const moderation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ReviewStatus }) =>
      sdk.client.fetch(`/admin/product-reviews/${id}`, { method: "POST", body: { status: nextStatus } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] })
      toast.success("Review updated")
    },
    onError: () => toast.error("Could not update review"),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <Heading>Product reviews</Heading>
          <Text size="small" className="text-ui-fg-subtle">Moderate customer reviews before publication.</Text>
        </div>
        <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatus)}>
          <Select.Trigger className="w-40"><Select.Value /></Select.Trigger>
          <Select.Content>
            <Select.Item value="pending">Pending</Select.Item>
            <Select.Item value="approved">Approved</Select.Item>
            <Select.Item value="rejected">Rejected</Select.Item>
            <Select.Item value="hidden">Hidden</Select.Item>
          </Select.Content>
        </Select>
      </div>
      <div className="divide-y">
        {query.isLoading && <Text className="block px-6 py-8 text-ui-fg-subtle">Loading reviews...</Text>}
        {!query.isLoading && (query.data?.reviews.length ?? 0) === 0 && <Text className="block px-6 py-8 text-ui-fg-subtle">No reviews in this queue.</Text>}
        {query.data?.reviews.map((review) => (
          <article key={review.id} className="space-y-3 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Text weight="plus">{review.author_name}</Text>
                <Text size="small" className="text-ui-fg-subtle">Product {review.product_id}</Text>
              </div>
              <Badge color={statusColor[review.status]}>{review.status}</Badge>
            </div>
            <div className="flex items-center gap-1 text-ui-fg-warning" aria-label={`${review.rating} of 5 stars`}>
              {Array.from({ length: 5 }, (_, index) => <Star key={index} className={index < review.rating ? "fill-current" : "opacity-30"} />)}
            </div>
            {review.title && <Text weight="plus">{review.title}</Text>}
            <Text className="whitespace-pre-line text-ui-fg-subtle">{review.body}</Text>
            <div className="flex flex-wrap gap-2">
              {review.status !== "approved" && <Button size="small" onClick={() => moderation.mutate({ id: review.id, nextStatus: "approved" })} disabled={moderation.isPending}>Approve</Button>}
              {review.status !== "rejected" && <Button size="small" variant="secondary" onClick={() => moderation.mutate({ id: review.id, nextStatus: "rejected" })} disabled={moderation.isPending}>Reject</Button>}
              {review.status !== "hidden" && <Button size="small" variant="transparent" onClick={() => moderation.mutate({ id: review.id, nextStatus: "hidden" })} disabled={moderation.isPending}>Hide</Button>}
            </div>
          </article>
        ))}
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Product reviews", icon: Star })

export default ProductReviewsPage
