import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { getRegion } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import { listCategories } from "@/lib/data/categories"
import { HOME_CATALOG_LIMIT, HOME_MAINTENANCE_CANDIDATE_LIMIT } from "@/lib/data/home-catalog"
import { getProductReviewSummaries } from "@/lib/data/product-review-summaries"
import { PUBLIC_HOME_PRODUCT_FIELDS } from "@/lib/data/product-fields"
import { useHydrated } from "@/lib/hooks/use-hydrated"
import { HOME_MAINTENANCE_CATEGORY_HANDLES, selectFeaturedInventoryProducts, selectHomeProducts } from "@/lib/data/home-products"
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
    queryKey: ["home-products", HOME_CATALOG_LIMIT, regionQuery.data?.id || ""],
    queryFn: () => listProducts({
      queryParams: { limit: HOME_CATALOG_LIMIT, offset: 0, order: "-created_at", fields: PUBLIC_HOME_PRODUCT_FIELDS },
      regionId: regionQuery.data!.id,
    }),
    enabled: hydrated && Boolean(regionQuery.data?.id),
  })

  const maintenanceCategoriesQuery = useQuery({
    queryKey: ["home-maintenance-categories"],
    queryFn: () => listCategories({
      fields: "id,handle",
      queryParams: { limit: 100, offset: 0 },
    }),
    enabled: hydrated,
    staleTime: 5 * 60_000,
  })

  const maintenanceCategoryIds = (maintenanceCategoriesQuery.data || [])
    .filter((category) => category.id && category.handle && HOME_MAINTENANCE_CATEGORY_HANDLES.has(category.handle.trim().toLowerCase()))
    .map((category) => category.id)

  const maintenanceProductsQuery = useQuery({
    queryKey: ["home-maintenance-products", regionQuery.data?.id || "", maintenanceCategoryIds],
    queryFn: () => listProducts({
      queryParams: {
        category_id: maintenanceCategoryIds,
        limit: HOME_MAINTENANCE_CANDIDATE_LIMIT,
        offset: 0,
        order: "-created_at",
        fields: PUBLIC_HOME_PRODUCT_FIELDS,
      },
      regionId: regionQuery.data!.id,
    }),
    enabled: hydrated && Boolean(regionQuery.data?.id) && maintenanceCategoryIds.length > 0,
  })

  const allProducts = (productsQuery.data?.response?.products || []) as HttpTypes.StoreProduct[]
  const specializedProducts = selectHomeProducts(allProducts, "specialized")
  const specializedIds = new Set(specializedProducts.map((product) => product.id))
  const maintenanceCandidates = (maintenanceProductsQuery.data?.response?.products || []) as HttpTypes.StoreProduct[]
  const maintenanceProducts = selectHomeProducts(maintenanceCandidates, "maintenance", {
    limit: 10,
    excludeIds: specializedIds,
  })
  const reservedProductIds = new Set([
    ...specializedProducts.map((product) => product.id),
    ...maintenanceProducts.map((product) => product.id),
  ])
  // Store API calculated prices and purchase state are authoritative. This
  // bounded selection removes the legacy full catalog/inventory scan from the
  // critical Home path after a refresh.
  const readyProducts = selectFeaturedInventoryProducts(allProducts, {
    excludeIds: reservedProductIds,
  })
  const generalSectionsLoading = !hydrated || regionQuery.isPending || productsQuery.isPending
  const maintenanceSectionLoading = !hydrated || regionQuery.isPending || maintenanceCategoriesQuery.isPending || maintenanceProductsQuery.isPending
  const homeProductIds = Array.from(new Set([
    ...specializedProducts.map((product) => product.id),
    ...readyProducts.map((product) => product.id),
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
        isLoading={generalSectionsLoading}
        emptyMessage="Nenhum produto especializado encontrado no momento."
        sectionId="home-specialized-products"
        showAllProductsLink
        reviewSummaries={reviewSummariesQuery.data}
      />
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos à pronta entrega"
        description="Itens disponíveis em estoque para agilizar sua compra."
        products={readyProducts}
        isLoading={generalSectionsLoading}
        emptyMessage="Nenhum produto à pronta entrega encontrado no momento."
        sectionId="home-best-sellers"
        reviewSummaries={reviewSummariesQuery.data}
      />
      <HomeWhatsAppQuoteBanner />
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos para manutenção"
        description="Componentes e insumos para manutenção de sistemas frigoríficos"
        products={maintenanceProducts}
        isLoading={maintenanceSectionLoading}
        emptyMessage="Nenhum item de manutenção disponível no momento."
        sectionId="home-maintenance-products"
        reviewSummaries={reviewSummariesQuery.data}
      />
    </>
  )
}
