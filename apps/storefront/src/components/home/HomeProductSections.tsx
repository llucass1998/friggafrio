import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { getRegion } from "@/lib/data/regions"
import { getHomeProductSelection, listProducts } from "@/lib/data/products"
import { HOME_CATALOG_LIMIT } from "@/lib/data/home-catalog"
import { getProductReviewSummaries } from "@/lib/data/product-review-summaries"
import { PUBLIC_HOME_PRODUCT_FIELDS } from "@/lib/data/product-fields"
import { queryKeys } from "@/lib/utils/query-keys"
import { useHydrated } from "@/lib/hooks/use-hydrated"
import { selectHomeProducts } from "@/lib/data/home-products"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { HomeProductSection } from "@/components/home/HomeProductSection"
import { HomeWhatsAppQuoteBanner } from "@/components/home/HomeWhatsAppQuoteBanner"

export function HomeProductSections() {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const hydrated = useHydrated()

  const regionQuery = useQuery({
    queryKey: ["region", countryCode],
    queryFn: () => getRegion({ country_code: countryCode }),
    enabled: hydrated,
  })

  const productsQuery = useQuery({
    queryKey: queryKeys.products.latest(HOME_CATALOG_LIMIT, regionQuery.data?.id || ""),
    queryFn: () => listProducts({
      queryParams: { limit: HOME_CATALOG_LIMIT, offset: 0, order: "-created_at", fields: PUBLIC_HOME_PRODUCT_FIELDS },
      regionId: regionQuery.data!.id,
    }),
    enabled: hydrated && Boolean(regionQuery.data?.id),
  })

  const allProducts = (productsQuery.data?.response?.products || []) as HttpTypes.StoreProduct[]
  const specializedProducts = selectHomeProducts(allProducts, "specialized")
  const specializedIds = new Set(specializedProducts.map((product) => product.id))
  const maintenanceProducts = selectHomeProducts(allProducts, "maintenance", {
    limit: 10,
    excludeIds: specializedIds,
  })
  const originalSectionIds = new Set([
    ...specializedProducts.map((product) => product.id),
    ...maintenanceProducts.map((product) => product.id),
  ])
  const homeSelectionQuery = useQuery({
    queryKey: [...queryKeys.products.homeSelection(regionQuery.data?.id), Array.from(originalSectionIds).sort()],
    queryFn: () => getHomeProductSelection(regionQuery.data!.id, { excludedProductIds: Array.from(originalSectionIds) }),
    enabled: hydrated && Boolean(regionQuery.data?.id),
  })
  // The Backend owns this selection. Client checks below only defend card
  // rendering against stale data between the selection and product hydration.
  const selectedHomeProducts = (homeSelectionQuery.data?.products || [])
    .filter((product) => !originalSectionIds.has(product.id))
    .filter((product) => getProductPurchaseState(product).status === "purchasable")
    .slice(0, 10)
  const useRanking = homeSelectionQuery.data?.source === "sales-ranking-30d" && selectedHomeProducts.length > 0
  const isLoading = !hydrated || regionQuery.isPending || productsQuery.isPending || homeSelectionQuery.isPending
  const homeProductIds = Array.from(new Set([
    ...specializedProducts.map((product) => product.id),
    ...selectedHomeProducts.map((product) => product.id),
    ...maintenanceProducts.map((product) => product.id),
  ])).sort()
  const reviewSummariesQuery = useQuery({
    queryKey: ["product-review-summaries", homeProductIds],
    queryFn: () => getProductReviewSummaries(homeProductIds),
    enabled: homeProductIds.length > 0,
    staleTime: 60_000,
  })

  return (
    <>
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos Especializados"
        description="Soluções técnicas para o seu projeto de refrigeração."
        products={specializedProducts}
        isLoading={isLoading}
        emptyMessage="Nenhum produto especializado encontrado no momento."
        sectionId="home-specialized-products"
        showAllProductsLink
        reviewSummaries={reviewSummariesQuery.data}
      />
      <HomeProductSection
        countryCode={countryCode}
        title={useRanking ? "Produtos mais vendidos" : "Produtos à pronta entrega"}
        description={useRanking ? "Os produtos mais vendidos nos últimos 30 dias em nossas lojas." : "Itens disponíveis em estoque para agilizar sua compra."}
        products={selectedHomeProducts}
        isLoading={isLoading}
        emptyMessage=""
        sectionId="home-best-sellers"
        hideWhenEmpty
        reviewSummaries={reviewSummariesQuery.data}
      />
      <HomeWhatsAppQuoteBanner />
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos para manutenção"
        description="Componentes e insumos para manutenção de sistemas frigoríficos"
        products={maintenanceProducts}
        isLoading={isLoading}
        emptyMessage="Nenhum item de manutenção disponível no momento."
        sectionId="home-maintenance-products"
        reviewSummaries={reviewSummariesQuery.data}
      />
    </>
  )
}
