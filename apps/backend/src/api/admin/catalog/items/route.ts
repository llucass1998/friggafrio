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

type ProductVariant = {
  id: string
  title?: string | null
  sku?: string | null
  inventory_quantity?: number | null
  prices?: Array<{ amount?: number | null; currency_code?: string }>
}

type RawProduct = {
  id: string
  title: string
  handle?: string | null
  status: string
  thumbnail?: string | null
  images?: Array<{ url: string }>
  collection_id?: string | null
  collection?: { id: string; title: string } | null
  categories?: Array<{ id: string; name: string }>
  metadata?: Record<string, unknown> | null
  variants?: ProductVariant[]
  created_at?: string
}

type OmieLink = {
  id: string
  code_display: string
  code_normalized: string
  product_id: string
  variant_id?: string | null
  source?: string | null
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse,
): Promise<void> => {
  res.setHeader("Cache-Control", "no-store")
  res.setHeader("Pragma", "no-cache")

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as QueryService

  const rawLimit = Number(req.query?.limit)
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20
  const rawOffset = Number(req.query?.offset)
  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  const filter = typeof req.query?.filter === "string" ? req.query.filter.trim() : "all"
  const rawQ = typeof req.query?.q === "string" ? req.query.q.trim() : ""
  const qFolded = rawQ.toLowerCase()

  try {
    // 1. Fetch products via Medusa query graph
    const { data: rawProducts } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "title",
        "handle",
        "status",
        "thumbnail",
        "images.url",
        "collection_id",
        "collection.id",
        "collection.title",
        "categories.id",
        "categories.name",
        "metadata",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.inventory_quantity",
        "variants.prices.amount",
        "variants.prices.currency_code",
        "created_at",
      ],
      filters: { deleted_at: null },
      pagination: { skip: 0, take: 10_000 },
    })

    const products = (rawProducts || []) as RawProduct[]

    // 2. Fetch Omie product links
    const omieMap = new Map<string, OmieLink>()
    try {
      const { data: omieLinks } = await query.graph({
        entity: "frigga_omie_product_link",
        fields: ["id", "code_display", "code_normalized", "product_id", "variant_id", "source"],
        filters: { deleted_at: null },
        pagination: { skip: 0, take: 10_000 },
      })
      for (const link of (omieLinks || [])) {
        if (typeof link.product_id === "string") {
          omieMap.set(link.product_id, link as unknown as OmieLink)
        }
      }
    } catch {
      // Entity not active or empty; continue gracefully
    }

    // 3. Filter products
    const filtered = products.filter((product) => {
      const omieLink = omieMap.get(product.id)
      const variants = Array.isArray(product.variants) ? product.variants : []
      const hasImage = Boolean(product.thumbnail || (product.images && product.images.length > 0))
      const hasPrice = variants.some((v) =>
        (v.prices || []).some((p) => typeof p.amount === "number" && p.amount > 0),
      )
      const totalStock = variants.reduce((sum, v) => sum + (v.inventory_quantity || 0), 0)
      const isQuoteOnly =
        product.metadata?.commercial_status === "QUOTE_ONLY" ||
        product.metadata?.quote_only === true ||
        !hasPrice

      // Search term matching
      if (qFolded) {
        const titleMatch = product.title?.toLowerCase().includes(qFolded)
        const handleMatch = product.handle?.toLowerCase().includes(qFolded)
        const omieMetaCode = typeof product.metadata?.omie_code === "string" ? product.metadata.omie_code.toLowerCase() : ""
        const omieDisplayMatch = omieLink?.code_display?.toLowerCase().includes(qFolded)
        const omieNormMatch = omieLink?.code_normalized?.toLowerCase().includes(qFolded) || omieMetaCode.includes(qFolded)
        const skuMatch = variants.some((v) => v.sku?.toLowerCase().includes(qFolded))
        const variantTitleMatch = variants.some((v) => v.title?.toLowerCase().includes(qFolded))
        const collectionMatch = product.collection?.title?.toLowerCase().includes(qFolded)
        const brandMatch =
          typeof product.metadata?.brand === "string" &&
          product.metadata.brand.toLowerCase().includes(qFolded)
        const marcaMatch =
          typeof product.metadata?.marca === "string" &&
          product.metadata.marca.toLowerCase().includes(qFolded)

        const matchesQuery =
          titleMatch ||
          handleMatch ||
          omieDisplayMatch ||
          omieNormMatch ||
          skuMatch ||
          variantTitleMatch ||
          collectionMatch ||
          brandMatch ||
          marcaMatch

        if (!matchesQuery) {
          return false
        }
      }

      // Operational filter
      switch (filter) {
        case "published":
          return product.status === "published"
        case "draft":
          return product.status === "draft"
        case "no_image":
          return !hasImage
        case "has_image":
          return hasImage
        case "no_price":
          return !hasPrice
        case "has_price":
          return hasPrice
        case "quote_only":
          return isQuoteOnly
        case "no_stock":
          return totalStock <= 0
        case "has_stock":
          return totalStock > 0
        case "no_omie":
          return !omieLink
        case "has_omie":
          return Boolean(omieLink)
        case "no_collection":
          return !product.collection_id && (!product.collection || !product.collection.id)
        case "all":
        default:
          return true
      }
    })

    const getTime = (val: unknown): number => {
      if (!val) return 0
      if (val instanceof Date) return val.getTime()
      const t = new Date(val as string | number).getTime()
      return Number.isFinite(t) ? t : 0
    }

    // Sort by created_at descending by default, or prioritize exact Omie code matches if searching
    if (qFolded) {
      filtered.sort((a, b) => {
        const aOmie = omieMap.get(a.id)?.code_normalized?.toLowerCase() === qFolded
        const bOmie = omieMap.get(b.id)?.code_normalized?.toLowerCase() === qFolded
        if (aOmie && !bOmie) return -1
        if (!aOmie && bOmie) return 1
        return getTime(b.created_at) - getTime(a.created_at)
      })
    } else {
      filtered.sort((a, b) => getTime(b.created_at) - getTime(a.created_at))
    }

    const totalCount = filtered.length
    const pageItems = filtered.slice(offset, offset + limit).map((product) => {
      const existingLink = omieMap.get(product.id)
      const omieCode = typeof product.metadata?.omie_code === "string" ? product.metadata.omie_code.trim() : null
      const fallbackLink: OmieLink | null = omieCode ? {
        id: `synthetic_${product.id}`,
        code_display: omieCode,
        code_normalized: omieCode.toUpperCase(),
        product_id: product.id,
        variant_id: product.variants?.[0]?.id || null,
        source: "omie-metadata",
      } : null

      return {
        ...product,
        omie_link: existingLink || fallbackLink,
      }
    })

    res.status(200).json({
      products: pageItems,
      count: totalCount,
      limit,
      offset,
      filter,
      q: rawQ,
    })
  } catch (error) {
    res.status(500).json({
      code: "CATALOG_ITEMS_ERROR",
      message: error instanceof Error ? error.message : "Erro ao carregar itens do catálogo.",
    })
  }
}
