import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { getRegion } from "@/lib/data/regions"
import { listProducts } from "@/lib/data/products"
import { PUBLIC_HOME_PRODUCT_FIELDS } from "@/lib/data/product-fields"
import { queryKeys } from "@/lib/utils/query-keys"
import { useHydrated } from "@/lib/hooks/use-hydrated"
import { selectHomeProducts } from "@/lib/data/home-products"
import { HomeProductSection } from "@/components/home/HomeProductSection"

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
    queryKey: queryKeys.products.latest(100, regionQuery.data?.id || ""),
    queryFn: () => listProducts({
      queryParams: {
        // Fetch the full seeded catalog window so the curated 5+5 shelf does
        // not depend on the API's newest-100 slice hiding a category.
        limit: 500,
        offset: 0,
        order: "-created_at",
        fields: PUBLIC_HOME_PRODUCT_FIELDS,
      },
      regionId: regionQuery.data!.id,
    }),
    enabled: hydrated && Boolean(regionQuery.data?.id),
  })

  const allProducts = (productsQuery.data?.response?.products || []) as HttpTypes.StoreProduct[]
  const specializedProducts = selectHomeProducts(allProducts, "specialized")
  const bestSellerProducts = selectHomeProducts(allProducts, "best_sellers", {
    limit: 10,
    excludeIds: new Set(specializedProducts.map((product) => product.id)),
  })
  const maintenanceProducts = selectHomeProducts(allProducts, "maintenance", {
    limit: 10,
    excludeIds: new Set([
      ...specializedProducts.map((product) => product.id),
      ...bestSellerProducts.map((product) => product.id),
    ]),
  })
  const isLoading = !hydrated || regionQuery.isPending || productsQuery.isPending

  return (
    <>
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos Especializados FriggaFrio"
        description="Soluções técnicas para o seu projeto de refrigeração"
        products={specializedProducts}
        isLoading={isLoading}
        emptyMessage="Nenhum produto especializado encontrado no momento."
        sectionId="home-specialized-products"
        showAllProductsLink
      />
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos mais vendidos"
        description="Uma seleção estável de itens disponíveis para agilizar sua compra"
        products={bestSellerProducts}
        isLoading={isLoading}
        emptyMessage="Nenhum produto disponível para esta seleção no momento."
        sectionId="home-best-sellers"
      />
      <HomeProductSection
        countryCode={countryCode}
        title="Produtos para manutenção"
        description="Componentes e insumos para manutenção de sistemas frigoríficos"
        products={maintenanceProducts}
        isLoading={isLoading}
        emptyMessage="Nenhum item de manutenção disponível no momento."
        sectionId="home-maintenance-products"
      />
    </>
  )
}
