import { listProducts, retrieveProduct } from "@/lib/data/products"
import { getRegion } from "@/lib/data/regions"
import { queryKeys } from "@/lib/utils/query-keys"
import { sanitize } from "@/lib/utils/sanitize"
import ProductDetails from "@/pages/product"
import { HttpTypes } from "@medusajs/types"
import { createFileRoute, notFound } from "@tanstack/react-router"

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
            fields:
              "*variants, +variants.inventory_quantity, +variants.manage_inventory, +variants.allow_backorder, +variants.calculated_price, *images, *options, *options.values, *collection, *tags",
          })
        } catch {
          // Logging removido em produção throw notFound();
        }
      },
    })

    // Cast as product to handle missing types safely
    const product = productData as unknown as HttpTypes.StoreProduct

    // Ensure related products are loaded for SSR to prevent hydration mismatch
    // This ensures consistent rendering between server and client
    await queryClient.ensureQueryData({
      queryKey: queryKeys.products.related(product.id, region.id),
      queryFn: async () => {
        const queryParams: Record<string, unknown> = {
          fields: "title, handle, *thumbnail, *variants",
          is_giftcard: false,
          limit: 4,
        }

        if (product.collection_id) {
          queryParams.collection_id = [product.collection_id]
        }

        if (product.tags && product.tags.length > 0) {
          queryParams.tag_id = product.tags.map((tag: {id: string}) => tag.id)
        }

        const { products } = await listProducts({
          query_params: queryParams,
          region_id: region.id,
        })

        return products.filter((p: {id: string}) => p.id !== product.id)
      },
    })

    return sanitize({
      countryCode,
      region,
      product,
    })
  },
  head: ({ loaderData }) => {
    const { product, region } = loaderData || {}

    if (!product) {
      return {
        meta: [
          {
            title: "Product Not Found | FriggaFrio",
          },
        ],
      }
    }

    // Create structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.title,
      description: product.description,
      image: (product.images as {url?: string}[])?.map((img: { url?: string }) => img.url).filter(Boolean) || [],
      brand: {
        "@type": "Brand",
        name: "FriggaFrio",
      },
      offers: {
        "@type": "Offer",
        availability: "https://schema.org/InStock",
        priceCurrency: region?.currency_code?.toUpperCase(),
        price: (product.variants as {calculated_price?: {calculated_amount?: number; currency_code?: string}}[])?.[0]?.calculated_price?.calculated_amount !== null && (product.variants as {calculated_price?: {calculated_amount?: number; currency_code?: string}}[])?.[0]?.calculated_price?.calculated_amount !== undefined
          ? (((product.variants as {calculated_price?: {calculated_amount?: number; currency_code?: string}}[])[0].calculated_price?.calculated_amount || 0) / 100).toFixed(2)
          : undefined,
      },
    }

    // Get first product image for preloading (critical for LCP)
    const firstImageUrl = (product.images as {url?: string}[])?.[0]?.url || product.thumbnail

    return {
      meta: [
        {
          title: `${product.title} | FriggaFrio`,
        },
        {
          name: "description",
          content: product.description || "Product details",
        },
        {
          property: "og:title",
          content: `${product.title} | FriggaFrio`,
        },
        {
          property: "og:description",
          content:
            product.description || "Check out this product on FriggaFrio",
        },
        {
          property: "og:image",
          content: product.thumbnail || "",
        },
      ],
      links: firstImageUrl
        ? [
            {
              rel: "preload",
              href: firstImageUrl,
              as: "image",
              fetchPriority: "high",
            },
          ]
        : [],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(structuredData),
        },
      ],
    }
  },
  component: ProductDetails,
})
