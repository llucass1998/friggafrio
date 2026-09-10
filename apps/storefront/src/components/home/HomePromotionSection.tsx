import { useQuery } from "@tanstack/react-query"
import { useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { getRegion } from "@/lib/data/regions"
import { getPromotionCampaigns } from "@/lib/data/promotions"
import { listProducts } from "@/lib/data/products"
import { getProductReviewSummaries } from "@/lib/data/product-review-summaries"
import { PublicProductCard } from "@/components/public-product-card"
import { PromotionTimer } from "@/components/home/PromotionTimer"
import { CarouselSectionHeader, CarouselSideControls, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import { PUBLIC_PRODUCT_CARD_FIELDS } from "@/lib/data/product-fields"

export function HomePromotionSection() {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const regionQuery = useQuery({ queryKey: ["region", countryCode], queryFn: () => getRegion({ country_code: countryCode }) })
  const campaignQuery = useQuery({
    queryKey: ["promotions", "home"],
    queryFn: getPromotionCampaigns,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  })
  // Catalog offers and automatic promotions are separate backend resources.
  // Only SALE lists belong here; Store API pricing then decides which of their
  // products are actually eligible for this region and currency.
  const activeCampaigns = (campaignQuery.data?.offers ?? [])
    .filter((item) => item.status === "active" && item.source === "price_list")
  const productIds = Array.from(new Set(activeCampaigns.flatMap((item) => item.productIds)))
  const sharedEndsAt = activeCampaigns.length > 0 && activeCampaigns.every((item) => item.endsAt === activeCampaigns[0].endsAt)
    ? activeCampaigns[0].endsAt
    : undefined
  const campaign = activeCampaigns.length > 0 ? {
    ...activeCampaigns[0],
    productIds,
    endsAt: sharedEndsAt ?? activeCampaigns[0].endsAt,
  } : undefined
  const { viewportRef, emblaApi, hasOverflow, canScrollPrev, canScrollNext, scrollPrev, scrollNext, onKeyDown } = useInfiniteCarousel([], false)
  const productQuery = useQuery({
    queryKey: ["promotions", productIds, regionQuery.data?.id],
    queryFn: () => listProducts({ queryParams: { id: productIds, limit: productIds.length, fields: PUBLIC_PRODUCT_CARD_FIELDS }, regionId: regionQuery.data!.id }),
    enabled: Boolean(productIds.length > 0 && regionQuery.data?.id),
    staleTime: 0,
    refetchOnWindowFocus: true,
    // The price-list projection can retain the same product IDs while its
    // official calculated prices change. Keep that projection in sync too.
    refetchInterval: 30_000,
  })

  const products = ((productQuery.data?.response?.products || []) as HttpTypes.StoreProduct[])
    .filter((product) => getProductPurchaseState(product).status === "purchasable")
    // A rule alone is not commercial evidence. Render only when Medusa's
    // region-aware calculated price is actually lower than the original price.
    .filter((product) => product.variants?.some((variant) => {
      const price = variant.calculated_price
      return typeof price?.calculated_amount === "number" &&
        typeof price.original_amount === "number" &&
        price.calculated_amount < price.original_amount &&
        Boolean(price.currency_code)
    }))
  const reviewSummariesQuery = useQuery({
    queryKey: ["product-review-summaries", products.map((product) => product.id).sort()],
    queryFn: () => getProductReviewSummaries(products.map((product) => product.id)),
    enabled: products.length > 0,
    staleTime: 60_000,
  })
  if (!campaign || productIds.length === 0) return null
  if (products.length === 0) return null

  const refreshCampaign = () => {
    void campaignQuery.refetch()
    void productQuery.refetch()
    emblaApi?.reInit()
  }

  return (
    <section className="w-full bg-[var(--color-background)] py-8 md:py-10" data-testid="home-promotions">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
        <div className="py-1">
          <CarouselSectionHeader
            title="Ofertas e promoções"
            description="Condições especiais em produtos selecionados."
            hasOverflow={hasOverflow}
            canScrollPrevious={canScrollPrev}
            canScrollNext={canScrollNext}
            onPrevious={scrollPrev}
            onNext={scrollNext}
            showControlsInHeader={false}
            previousLabel="Ver produtos promocionais anteriores"
            nextLabel="Ver próximos produtos promocionais"
            action={sharedEndsAt ? <PromotionTimer campaign={campaign} serverNow={campaignQuery.data?.serverNow || new Date().toISOString()} onExpired={refreshCampaign} /> : undefined}
          />
          <div className="ff-carousel-stage ff-product-carousel-stage">
            <CarouselSideControls side="previous" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollPrev} onNext={scrollNext} previousLabel="Produtos promocionais anteriores" nextLabel="Próximos produtos promocionais" />
            <div ref={viewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" tabIndex={0} aria-label={`${campaign.title}: produtos promocionais`} onKeyDown={onKeyDown}>
              <div className={`ff-carousel-track${products.length <= 2 ? " ff-carousel-track--short" : ""}`} data-carousel-track="true">
              {products.map((product) => (
                <div key={product.id} className="ff-carousel-slide ff-product-slide flex min-w-0" data-carousel-slide="true">
                  <PublicProductCard product={product} compact showInstallment={true} reviewSummary={reviewSummariesQuery.data?.[product.id]} promotionLabel={campaign.discountLabel ?? (() => {
                    const variant = product.variants?.find((item) => item.calculated_price?.calculated_amount != null && item.calculated_price?.original_amount != null)
                    const calculated = variant?.calculated_price?.calculated_amount
                    const original = variant?.calculated_price?.original_amount
                    if (typeof calculated !== "number" || typeof original !== "number" || original <= 0 || calculated >= original) return undefined
                    return `${Math.round((1 - calculated / original) * 100)}% OFF`
                  })()} />
                </div>
              ))}
              </div>
            </div>
            <CarouselSideControls side="next" hasOverflow={hasOverflow} canScrollPrevious={canScrollPrev} canScrollNext={canScrollNext} onPrevious={scrollPrev} onNext={scrollNext} previousLabel="Produtos promocionais anteriores" nextLabel="Próximos produtos promocionais" />
          </div>
        </div>
      </div>
    </section>
  )
}
