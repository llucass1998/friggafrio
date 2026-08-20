import { useQuery } from "@tanstack/react-query"
import { Heart, Loader2 } from "lucide-react"
import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { PublicProductCard } from "@/components/public-product-card"
import { useFavorites } from "@/lib/hooks/use-favorites"
import { sdk } from "@/lib/medusa"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"

export default function FavoritesPage() {
  const { favoriteIds, favoriteCount } = useFavorites()
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["favorite-products", countryCode, ...favoriteIds],
    queryFn: async (): Promise<HttpTypes.StoreProduct[]> => {
      const { products } = await sdk.store.product.list({
        id: favoriteIds,
        limit: favoriteIds.length,
        fields: PUBLIC_PRODUCT_CARD_FIELDS,
      })
      const order = new Map(favoriteIds.map((id, index) => [id, index]))
      return [...products].sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0))
    },
    enabled: favoriteIds.length > 0,
    placeholderData: (previousData) => previousData,
  })

  // Keep the previous response as a visual placeholder while the new id set
  // is fetched, but always honor the current optimistic favorite state.
  const visibleProducts = products.filter((product) => favoriteIds.includes(product.id))

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              <Heart className="h-4 w-4" aria-hidden="true" /> Produtos salvos
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--color-navy)]">Meus favoritos</h1>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]" aria-live="polite">
              {favoriteCount === 1 ? "1 produto salvo para consultar depois." : `${favoriteCount} produtos salvos para consultar depois.`}
            </p>
          </div>
          <Link
            to="/$countryCode/store"
            params={{ countryCode }}
            search={{}}
            className="inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button-sm)] border border-[var(--color-border)] px-4 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
          >
            Explorar produtos
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Carregando favoritos...
          </div>
        ) : visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {visibleProducts.map((product) => <PublicProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-white px-6 py-16 text-center">
            <Heart className="mx-auto h-10 w-10 text-[var(--color-primary)]" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-bold text-[var(--color-navy)]">Sua lista está vazia</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-text-muted)]">Use o coração nos produtos para montar sua lista de referência.</p>
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              search={{}}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-button-sm)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              Explorar produtos
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
