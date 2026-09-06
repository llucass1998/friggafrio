import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { selectHomeProductSelection } from "../../../../integrations/catalog/home-selection"
import {
  filterEligibleCatalog,
  type CatalogInventoryLevel,
  type CatalogProduct,
} from "../../../../integrations/catalog/eligibility"

type Query = {
  graph: (input: {
    entity: string
    fields: string[]
    filters?: Record<string, unknown>
    pagination?: { skip: number; take: number }
  }) => Promise<{ data: unknown[] }>
}

type GraphProduct = CatalogProduct & {
  variants?: Array<{
    id?: string | null
    sku?: string | null
    inventory_items?: Array<{ inventory_item_id?: string | null }> | null
  }> | null
}

type HomeDiagnosticReason =
  | "NOT_PUBLISHED"
  | "INVENTORY_ZERO"
  | "INVENTORY_UNKNOWN"
  | "OMIE_LINK_MISSING"
  | "CATEGORY_BLOCKED"
  | "COMMERCIAL_MARKER_MISSING"
  | "DUPLICATE_PRODUCT"

const excludedProductIds = (value: unknown): Set<string> => {
  if (typeof value !== "string") return new Set()
  return new Set(value.split(",").map((id) => id.trim()).filter(Boolean).slice(0, 100))
}

const createDiagnostics = (
  products: readonly GraphProduct[],
  excluded: ReadonlyArray<{ reasons: readonly string[] }>,
  eligibleCount: number,
) => {
  const reasons: Record<HomeDiagnosticReason, number> = {
    NOT_PUBLISHED: 0,
    INVENTORY_ZERO: 0,
    INVENTORY_UNKNOWN: 0,
    OMIE_LINK_MISSING: 0,
    CATEGORY_BLOCKED: 0,
    COMMERCIAL_MARKER_MISSING: 0,
    DUPLICATE_PRODUCT: 0,
  }
  for (const entry of excluded) {
    const source = new Set(entry.reasons)
    if (source.has("NOT_PUBLISHED")) reasons.NOT_PUBLISHED += 1
    if (source.has("NO_POSITIVE_STOCK")) reasons.INVENTORY_ZERO += 1
    if (source.has("AMBIGUOUS_INVENTORY") || source.has("MISSING_VARIANT_MAPPING")) reasons.INVENTORY_UNKNOWN += 1
    if (source.has("MISSING_OMIE_CODE")) reasons.OMIE_LINK_MISSING += 1
    if (source.has("CATEGORY_NOT_ALLOWED")) reasons.CATEGORY_BLOCKED += 1
    if (source.has("PURCHASE_DISABLED") || source.has("CATALOG_NOT_APPROVED") || source.has("INVALID_UNIT")) reasons.COMMERCIAL_MARKER_MISSING += 1
    if (source.has("DUPLICATE_OMIE_CODE") || source.has("DUPLICATE_SKU")) reasons.DUPLICATE_PRODUCT += 1
  }
  return {
    total: products.length,
    published: products.filter((product) => product.status === "published").length,
    omieLinked: products.filter((product) => {
      const metadata = product.metadata ?? {}
      return typeof metadata.omie_external_id === "string" || typeof metadata.omie_code === "string"
    }).length,
    eligible: eligibleCount,
    reasons,
  }
}

export async function GET(req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query
  try {
    const [{ data: locations }, { data: products }, { data: levels }] = await Promise.all([
      query.graph({ entity: "stock_location", fields: ["id", "name"], pagination: { skip: 0, take: 100 } }),
      query.graph({
      entity: "product",
      fields: [
        "id",
        "status",
        "metadata",
        "categories.handle",
        "variants.id",
        "variants.sku",
        "variants.inventory_items.inventory_item_id",
      ],
      filters: { deleted_at: null },
      pagination: { skip: 0, take: 5_000 },
      }),
      query.graph({
      entity: "inventory_level",
      fields: ["inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"],
      pagination: { skip: 0, take: 10_000 },
      }),
    ])

    const configuredLocation = String(process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID ?? "").trim()
    const namedLocation = (locations as Array<{ id?: string; name?: string }>).find((location) => location.name === "FriggaFrio - Loja 1 / Matriz")?.id
    const locationId = configuredLocation || namedLocation
    if (!locationId) {
      res.json({ source: "featured-inventory-fallback", generatedAt: new Date().toISOString(), products: [], ranking_status: "AWAITING_OMIE_SALES_ADAPTER", reason: "STOCK_LOCATION_UNRESOLVED" })
      return
    }

    const graphProducts = products as GraphProduct[]
    const catalog = filterEligibleCatalog(graphProducts, levels as CatalogInventoryLevel[], locationId)
    const excluded = excludedProductIds(req.query?.exclude_ids)
    const selection = selectHomeProductSelection({
      ranking: null,
      eligibleProductIds: catalog.included.map((product) => product.id).filter((id) => !excluded.has(id)),
    })

    res.json({
      source: selection.source,
      generatedAt: new Date().toISOString(),
      products: selection.productIds.map((id) => ({ id })),
      ranking_status: "AWAITING_OMIE_SALES_ADAPTER",
      ...(process.env.NODE_ENV === "development"
        ? { diagnostics: createDiagnostics(graphProducts, catalog.excluded, catalog.included.length) }
        : {}),
    })
  } catch {
    res.json({
      source: "featured-inventory-fallback",
      generatedAt: new Date().toISOString(),
      products: [],
      ranking_status: "AWAITING_OMIE_SALES_ADAPTER",
      unavailable: true,
    })
  }
}
