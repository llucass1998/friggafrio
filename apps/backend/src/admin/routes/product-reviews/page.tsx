import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Badge, Button, Text, Select, toast } from "@medusajs/ui"
import { Star } from "@medusajs/icons"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../lib/client"
import { BrandHeader } from "../../components/brand-header"

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

const statusLabel: Record<ReviewStatus, string> = {
  pending: "Pendente",
  approved: "Aprovada",
  rejected: "Rejeitada",
  hidden: "Oculta",
}

const ProductReviewsPage = () => {
  const [status, setStatus] = useState<ReviewStatus>("pending")
  const queryClient = useQueryClient()
  const query = useQuery<Response>({
    queryKey: ["admin-product-reviews", status],
    queryFn: () =>
      sdk.client.fetch<Response>("/admin/product-reviews", {
        query: { status, limit: 50, offset: 0 },
      }),
  })
  const moderation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: string; nextStatus: ReviewStatus }) =>
      sdk.client.fetch(`/admin/product-reviews/${id}`, {
        method: "POST",
        body: { status: nextStatus },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] })
      toast.success("Avaliação atualizada com sucesso.")
    },
    onError: () => toast.error("Não foi possível atualizar a avaliação."),
  })

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <BrandHeader
        title="Avaliações de Produtos"
        subtitle="Moderação de avaliações e comentários de clientes para a loja."
        badgeText="Qualidade"
      />

      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <Heading level="h2">Fila de Moderação</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Filtre as avaliações por status para aprovar ou rejeitar.
            </Text>
          </div>
          <Select value={status} onValueChange={(value) => setStatus(value as ReviewStatus)}>
            <Select.Trigger className="w-44">
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="pending">Pendentes</Select.Item>
              <Select.Item value="approved">Aprovadas</Select.Item>
              <Select.Item value="rejected">Rejeitadas</Select.Item>
              <Select.Item value="hidden">Ocultas</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div className="divide-y">
          {query.isLoading && (
            <Text className="block px-6 py-8 text-ui-fg-subtle">Carregando avaliações...</Text>
          )}
          {!query.isLoading && (query.data?.reviews.length ?? 0) === 0 && (
            <Text className="block px-6 py-8 text-ui-fg-subtle">
              Nenhuma avaliação encontrada nesta fila.
            </Text>
          )}
          {query.data?.reviews.map((review) => (
            <article key={review.id} className="space-y-3 px-6 py-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Text weight="plus" className="text-ui-fg-base">{review.author_name}</Text>
                  <Text size="small" className="text-ui-fg-subtle">Produto: {review.product_id}</Text>
                </div>
                <Badge color={statusColor[review.status]}>{statusLabel[review.status]}</Badge>
              </div>
              <div
                className="flex items-center gap-1 text-ui-fg-warning"
                aria-label={`${review.rating} de 5 estrelas`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className={index < review.rating ? "fill-current" : "opacity-30"}
                  />
                ))}
              </div>
              {review.title && <Text weight="plus">{review.title}</Text>}
              <Text className="whitespace-pre-line text-ui-fg-subtle">{review.body}</Text>
              <div className="flex flex-wrap gap-2 pt-1">
                {review.status !== "approved" && (
                  <Button
                    size="small"
                    onClick={() => moderation.mutate({ id: review.id, nextStatus: "approved" })}
                    disabled={moderation.isPending}
                  >
                    Aprovar
                  </Button>
                )}
                {review.status !== "rejected" && (
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => moderation.mutate({ id: review.id, nextStatus: "rejected" })}
                    disabled={moderation.isPending}
                  >
                    Rejeitar
                  </Button>
                )}
                {review.status !== "hidden" && (
                  <Button
                    size="small"
                    variant="transparent"
                    onClick={() => moderation.mutate({ id: review.id, nextStatus: "hidden" })}
                    disabled={moderation.isPending}
                  >
                    Ocultar
                  </Button>
                )}
              </div>
            </article>
          ))}
        </div>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Avaliações de Produtos",
  icon: Star,
  rank: 5,
})

export default ProductReviewsPage
