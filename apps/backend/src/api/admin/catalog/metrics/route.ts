import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type QueryService = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip?: number; take?: number }
  }) => Promise<{ data: Record<string, unknown>[] }>
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> => {
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("Pragma", "no-cache")

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as QueryService

  try {
    // Query all active products with variants, images, prices, collections and channels
    const { data: rawProducts } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "status",
        "thumbnail",
        "images.url",
        "collection_id",
        "sales_channels.id",
        "metadata",
        "variants.id",
        "variants.inventory_quantity",
        "variants.prices.amount",
      ],
      filters: { deleted_at: null },
      pagination: { skip: 0, take: 10_000 },
    })

    const products = rawProducts || []

    // Query all active Omie product links
    let omieLinkedProductIds = new Set<string>()
    try {
      const { data: omieLinks } = await query.graph({
        entity: "frigga_omie_product_link",
        fields: ["id", "product_id"],
        filters: { deleted_at: null },
        pagination: { skip: 0, take: 10_000 },
      })
      omieLinkedProductIds = new Set(
        (omieLinks || [])
          .map((link) => link.product_id as string)
          .filter(Boolean),
      )
    } catch {
      // Omie link entity not yet created or table empty; fallback gracefully
      omieLinkedProductIds = new Set()
    }

    // Query pending quotes if quote module exists
    let pendingQuotes = 0
    try {
      const { data: quotes } = await query.graph({
        entity: "quote",
        fields: ["id", "status"],
        filters: { status: "pending" },
        pagination: { skip: 0, take: 1_000 },
      })
      pendingQuotes = quotes?.length || 0
    } catch {
      pendingQuotes = 0
    }

    // Query pending product reviews
    let pendingReviews = 0
    try {
      const { data: reviews } = await query.graph({
        entity: "product_review",
        fields: ["id", "status"],
        filters: { status: "pending" },
        pagination: { skip: 0, take: 1_000 },
      })
      pendingReviews = reviews?.length || 0
    } catch {
      pendingReviews = 0
    }

    let published = 0
    let draft = 0
    let noImage = 0
    let noPrice = 0
    let quoteOnly = 0
    let noCollection = 0
    let noSalesChannel = 0
    let omieLinked = 0
    let noStock = 0

    for (const product of products) {
      const status = product.status as string
      if (status === "published") {
        published++
      } else if (status === "draft") {
        draft++
      }

      // Image check
      const thumbnail = product.thumbnail as string | null
      const images = Array.isArray(product.images) ? product.images : []
      if (!thumbnail && images.length === 0) {
        noImage++
      }

      // Price & stock check across variants
      const variants = Array.isArray(product.variants) ? product.variants : []
      let hasAnyPrice = false
      let totalStock = 0

      for (const variant of variants) {
        const prices = Array.isArray(variant.prices) ? variant.prices : []
        const hasPrice = prices.some(
          (p: { amount?: number | null }) => typeof p.amount === "number" && p.amount > 0,
        )
        if (hasPrice) {
          hasAnyPrice = true
        }

        const qty = typeof variant.inventory_quantity === "number" ? variant.inventory_quantity : 0
        totalStock += qty
      }

      if (!hasAnyPrice) {
        noPrice++
      }

      // Quote only check: explicitly marked as QUOTE_ONLY in metadata or without price
      const meta = (product.metadata as Record<string, unknown>) || {}
      if (meta.commercial_status === "QUOTE_ONLY" || meta.quote_only === true || !hasAnyPrice) {
        quoteOnly++
      }

      // Collection check
      if (!product.collection_id) {
        noCollection++
      }

      // Sales channel check
      const channels = Array.isArray(product.sales_channels) ? product.sales_channels : []
      if (channels.length === 0) {
        noSalesChannel++
      }

      // Omie link check
      const productId = product.id as string
      if (productId && omieLinkedProductIds.has(productId)) {
        omieLinked++
      }

      // Stock check
      if (totalStock <= 0) {
        noStock++
      }
    }

    const total = products.length
    const omiePending = Math.max(0, total - omieLinked)

    res.status(200).json({
      metrics: {
        total,
        published,
        draft,
        no_image: noImage,
        no_price: noPrice,
        quote_only: quoteOnly,
        no_collection: noCollection,
        no_sales_channel: noSalesChannel,
        omie_linked: omieLinked,
        omie_pending: omiePending,
        no_stock: noStock,
        pending_quotes: pendingQuotes,
        pending_reviews: pendingReviews,
        last_updated: new Date().toISOString(),
      },
    })
  } catch (error) {
    res.status(500).json({
      code: "CATALOG_METRICS_ERROR",
      message: error instanceof Error ? error.message : "Erro ao calcular métricas do catálogo.",
    })
  }
}
