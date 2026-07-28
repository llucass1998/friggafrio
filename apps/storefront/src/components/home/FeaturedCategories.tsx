import { useQuery } from "@tanstack/react-query"
import { listCategories } from "@/lib/data/categories"
import { FeaturedCategoriesCarousel } from "./featured-categories-carousel/FeaturedCategoriesCarousel"

export function FeaturedCategories() {
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategories(),
    retry: 1,
  })

  const isLoading = categoriesQuery.isPending
  const isError = categoriesQuery.isError
  const categories = categoriesQuery.data || []

  // Mostrar apenas as categorias principais
  // Filtramos aquelas com "attachments", "forklift-parts", "material-handling", "operator-accessories", "safety-equipment", "warehouse-equipment"
  const ignoredHandles = ["attachments", "forklift-parts", "material-handling", "operator-accessories", "safety-equipment", "warehouse-equipment"]
  const mainCategories = categories
    .filter(cat => cat.handle && !cat.parent_category_id && !ignoredHandles.includes(cat.handle))
    .slice(0, 10)

  const showEmptyState = !isLoading && !isError && mainCategories.length === 0

  return (
    <section className="py-16 bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FeaturedCategoriesCarousel
          categories={mainCategories as any}
          isLoading={isLoading}
          isError={isError}
          showEmptyState={showEmptyState}
          onRetry={() => categoriesQuery.refetch()}
        />
      </div>
    </section>
  )
}
