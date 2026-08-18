import { Link, useParams } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { listProducts } from "@/lib/data/products"
import { queryKeys } from "@/lib/utils/query-keys"
import { getRegion } from "@/lib/data/regions"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"
import { PublicProductCard } from "@/components/public-product-card"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { useEffect, useState } from "react"
import type { HttpTypes } from "@medusajs/types"

export function FeaturedProducts() {
  const [isHydrated, setIsHydrated] = useState(false)
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const { data: region } = useQuery({
    queryKey: ["region", countryCode],
    queryFn: () => getRegion({ country_code: countryCode }),
  })

  // Fetch a sufficiently broad recent window, then prioritize products that
  // are actually sellable instead of showcasing the newest out-of-stock rows.
  const { data: productsData, isLoading } = useQuery({
    queryKey: queryKeys.products.latest(100, region?.id || ""),
    queryFn: () =>
      listProducts({
        queryParams: {
          limit: 100,
          offset: 0,
          order: "-created_at",
          fields: PUBLIC_PRODUCT_CARD_FIELDS,
        },
        regionId: region!.id,
      }),
    enabled: !!region?.id,
  })

  const products = (productsData?.response?.products || [])
    .filter((product) => getProductPurchaseState(product as HttpTypes.StoreProduct).status === "purchasable")
    .slice(0, 4)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <section className="py-10 md:py-16 lg:py-24 bg-white relative w-full mb-12 md:mb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full h-full flex flex-col">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-2">Produtos Especializados FriggaFrio</h2>
            <p className="text-[var(--color-text-muted)] text-sm md:text-base">As soluções mais procuradas para o seu projeto</p>
          </div>
          <Link
            to={"/$countryCode/store" as string}
            params={{ countryCode }}

            className="hidden md:inline-flex text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
          >
            Ver todos os produtos
          </Link>
        </div>

        {!isHydrated || isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 w-full">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] h-full">
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-6 bg-gray-200 rounded w-full" />
                  <div className="h-6 bg-gray-200 rounded w-2/3" />
                  <div className="mt-auto h-10 bg-gray-200 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 w-full">
            {products.map((product) => (
              <PublicProductCard key={product.id} product={product as HttpTypes.StoreProduct} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[var(--color-text-muted)] min-h-[400px] flex items-center justify-center">
            Nenhum produto especializado encontrado no momento.
          </div>
        )}
      </div>
    </section>
  )
}
