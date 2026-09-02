import { retrieveProduct } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { queryKeys } from "@/lib/utils/query-keys"
import { sanitize } from "@/lib/utils/sanitize"
import { formatMoneyAmountForStructuredData } from "@/lib/utils/price"
import { decodeProductText } from "@/lib/utils/product-text"
import { getProductPurchaseState } from "@/lib/utils/product-state"
import ProductDetails from "@/pages/product"
import { HttpTypes } from "@medusajs/types"
import { createFileRoute, notFound } from "@tanstack/react-router"
import { PUBLIC_PRODUCT_DETAIL_FIELDS } from "@/lib/data/product-fields"
import { getProductReviews, type ProductReviewSummary } from "@/lib/data/product-reviews"
import { getRelatedProducts } from "@/lib/data/related-products"
import { absoluteSiteUrl, breadcrumbStructuredData, pageMeta, structuredDataScript } from "@/lib/seo"
import { isLoopbackMediaUrl } from "@/lib/media-url"

const publicMediaUrl = (value: string | null | undefined): string | undefined => {
  if (!value?.trim()) return undefined
  return isLoopbackMediaUrl(value) ? undefined : value
}

export const Route = createFileRoute("/$countryCode/products/$handle")({
  loader: async ({ params, context }) => {
    const { countryCode, handle } = params
    const { queryClient } = context

    const region = await queryClient.ensureQueryData({
      queryKey: ["region", countryCode],
      queryFn: () => getRegion({ country_code: countryCode }),
    })

    if (!region || !handle) {
      throw notFound()
    }

    // Single comprehensive product fetch with all needed fields
    const productData = await queryClient.ensureQueryData({
      queryKey: ["product", handle, region.id],
      queryFn: async () => {
        try {
          return await retrieveProduct({
            handle,
            region_id: region.id,
            fields: PUBLIC_PRODUCT_DETAIL_FIELDS,
          })
        } catch {
          throw notFound()
          // Logging removido em produção throw notFound();
        }
      },
    })

    if (!productData) {
      throw notFound()
    }

    // Cast as product to handle missing types safely
    const product = productData as unknown as HttpTypes.StoreProduct

    // Ensure related products are loaded for SSR to prevent hydration mismatch
    // This ensures consistent rendering between server and client
    await queryClient.ensureQueryData({
      queryKey: queryKeys.products.related(product.id, region.id),
      queryFn: () => getRelatedProducts(product, region.id),
    })

    const reviewSummary = await queryClient.ensureQueryData<ProductReviewSummary | null>({
      queryKey: ["product-review-summary", product.id],
      queryFn: async () => {
        try {
          const response = await getProductReviews({ productId: product.id, limit: 1 })
          return response.summary
        } catch {
          return null
        }
      },
    })

    return sanitize({
      countryCode,
      region,
      product,
      reviewSummary,
    })
  },
  head: ({ loaderData }) => {
    const { product, region, countryCode, reviewSummary } = loaderData || {}

    if (!product) {
      return {
        meta: [
          {
            title: "Product Not Found | FriggaFrio",
          },
        ],
      }
    }

    const structuredPrice =
      product.variants?.[0]?.calculated_price?.calculated_amount
    const productName = decodeProductText(product.title)
    const productDescription = product.description ? decodeProductText(product.description) : ""
    const purchaseState = getProductPurchaseState(product)
    const availability = purchaseState.status === "out_of_stock"
      ? "https://schema.org/OutOfStock"
      : purchaseState.status === "purchasable" || purchaseState.status === "select_variant"
        ? "https://schema.org/InStock"
        : "https://schema.org/PreOrder"

    // Product offers are emitted only when the API supplied a real price.
    // Pending/quote-only products must not publish an incomplete Offer.
    const structuredData: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: productName,
      description: productDescription,
      ...(product.images?.length
        ? { image: product.images.map((image: { url?: string }) => publicMediaUrl(image.url)).filter(Boolean) }
        : publicMediaUrl(product.thumbnail)
          ? { image: [publicMediaUrl(product.thumbnail)] }
          : {}),
      ...(product.variants?.[0]?.sku ? { sku: product.variants[0].sku } : {}),
      url: absoluteSiteUrl(`/${countryCode}/products/${product.handle}`),
      brand: {
        "@type": "Brand",
        name: "FriggaFrio",
      },
      ...(structuredPrice !== null && structuredPrice !== undefined && region?.currency_code
        ? {
            offers: {
              "@type": "Offer",
              availability,
              priceCurrency: region.currency_code.toUpperCase(),
              price: formatMoneyAmountForStructuredData(structuredPrice),
              url: absoluteSiteUrl(`/${countryCode}/products/${product.handle}`),
            },
          }
        : {}),
    }

    if (reviewSummary?.total && reviewSummary.average !== null) {
      structuredData.aggregateRating = {
        "@type": "AggregateRating",
        ratingValue: reviewSummary.average,
        reviewCount: reviewSummary.total,
        bestRating: 5,
        worstRating: 1,
      }
    }

    // Get first product image for preloading (critical for LCP)
    const firstImageUrl = (product.images as any[])?.map((image) => publicMediaUrl(image?.url)).find(Boolean) || publicMediaUrl(product.thumbnail)

    const metadata = pageMeta({
      title: `${productName} | FriggaFrio`,
      description: productDescription || "Confira os detalhes deste produto FriggaFrio.",
      path: `/${countryCode}/products/${product.handle}`,
      image: firstImageUrl,
    })

    return {
      ...metadata,
      links: [
        ...(firstImageUrl
          ? [{ rel: "preload", href: firstImageUrl, as: "image", fetchPriority: "high" as const }]
          : []),
        ...metadata.links,
      ],
      scripts: [
        structuredDataScript(structuredData),
        structuredDataScript(breadcrumbStructuredData([
          { name: "Home", path: `/${countryCode}` },
          { name: "Catálogo", path: `/${countryCode}/store` },
          { name: productName, path: `/${countryCode}/products/${product.handle}` },
        ])),
      ],
    }
  },
  component: ProductDetails,
})
