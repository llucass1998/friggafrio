import { useQuery } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa"

type ReviewSummaryResponse = {
  summary: { average: number | null; total: number }
}

export function ProductRating({ productId }: { productId: string }) {
  const { data } = useQuery({
    queryKey: ["product-rating", productId],
    queryFn: () => sdk.client.fetch<ReviewSummaryResponse>(`/store/products/${productId}/reviews?limit=1`),
    enabled: Boolean(productId),
    staleTime: 60_000,
  })
  const total = data?.summary.total ?? 0
  const average = data?.summary.average

  if (total === 0) return <span className="text-xs text-[var(--color-text-muted)]" aria-label="Este produto ainda não possui avaliações">Sem avaliações</span>
  const rounded = Math.max(0, Math.min(5, Math.round(average || 0)))
  return (
    <span className="inline-flex items-center gap-1 text-xs" aria-label={`${average?.toLocaleString("pt-BR", { minimumFractionDigits: 1 })} de 5 estrelas, ${total} avaliações`}>
      <span className="tracking-[0.08em] text-amber-500" aria-hidden="true">{"★".repeat(rounded)}<span className="text-slate-300">{"☆".repeat(5 - rounded)}</span></span>
      <span className="font-semibold text-[var(--color-navy)]">{average?.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}</span>
      <span className="text-[var(--color-text-muted)]">({total})</span>
    </span>
  )
}

export default ProductRating
