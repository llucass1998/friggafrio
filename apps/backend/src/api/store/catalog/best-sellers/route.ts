import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { aggregateBestSellers, type SalesEvent } from "../../../../integrations/catalog/best-sellers"
import { filterEligibleCatalog, type CatalogInventoryLevel, type CatalogProduct } from "../../../../integrations/catalog/eligibility"

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown>; pagination?: { skip?: number; take?: number } }) => Promise<{ data: unknown[] }>
}

type GraphProduct = CatalogProduct & {
  variants?: Array<{
    id?: string | null
    sku?: string | null
    inventory_items?: Array<{ inventory_item_id?: string | null }> | null
  }> | null
}

type GraphOrder = {
  id?: string
  status?: string | null
  created_at?: string | Date | null
  canceled_at?: string | Date | null
  metadata?: Record<string, unknown> | null
  items?: Array<Record<string, unknown>> | null
}

const asNumber = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

const asDate = (value: unknown): string | null => {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

const isConfirmedOrder = (order: GraphOrder): boolean =>
  ["completed", "archived"].includes(String(order.status ?? "").toLowerCase()) &&
  !order.canceled_at &&
  order.metadata?.test_order !== true

const returnedQuantityFor = (item: Record<string, unknown>): number | null => {
  for (const key of ["quantity_returned", "returned_quantity", "quantity_returned_to_stock", "return_received_quantity"]) {
    const value = asNumber(item[key])
    if (value !== null) return value
  }
  return null
}

const onlineSales = (orders: readonly GraphOrder[]): SalesEvent[] => orders.flatMap((order) => {
  if (!order.id || !isConfirmedOrder(order)) return []
  const soldAt = asDate(order.created_at)
  if (!soldAt) return []
  return (order.items ?? []).flatMap((item) => {
    const variant = item.variant as Record<string, unknown> | undefined
    const product = (item.product ?? variant?.product) as Record<string, unknown> | undefined
    const productId = String(item.product_id ?? variant?.product_id ?? product?.id ?? "").trim()
    const quantity = asNumber(item.quantity)
    if (!productId || quantity === null || quantity <= 0) return []
    const returnedQuantity = returnedQuantityFor(item)
    return [{
      source: "medusa" as const,
      productId,
      quantity,
      returnedQuantity,
      soldAt,
      orderId: order.id,
      confirmed: true,
      cancelled: false,
      testOrder: Boolean(item.metadata && typeof item.metadata === "object" && (item.metadata as Record<string, unknown>).test_order === true),
    }]
  })
})

/**
 * The repository currently has no read-only Omie sales-order adapter. Keeping
 * this source unavailable is intentional: the homepage must not label a
 * merchandising fallback as a real multichannel sales ranking.
 */
const physicalSalesUnavailable = (): { events: SalesEvent[]; available: false } => ({ events: [], available: false })

export async function GET(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  const locationId = String(process.env.OMIE_STOREFRONT_STOCK_LOCATION_ID ?? "").trim()
  if (!locationId) {
    res.json({ available: false, reason: "OMIE_STOCK_LOCATION_NOT_CONFIGURED", products: [] })
    return
  }

  // Do not query order data until a read-only Omie sales source and a
  // deterministic cross-channel link are available. An unavailable physical
  // source must keep the homepage neutral and avoid an unnecessary failure
  // surface on the public endpoint.
  const physical = physicalSalesUnavailable()
  if (!physical.available) {
    res.json({ available: false, reason: "PHYSICAL_SOURCE_UNAVAILABLE", products: [] })
    return
  }

  const query = _req.scope.resolve(ContainerRegistrationKeys.QUERY) as Query

  const [{ data: products }, { data: levels }, { data: orders }] = await Promise.all([
    query.graph({
      entity: "product",
      fields: ["id", "status", "metadata", "categories.handle", "variants.id", "variants.sku", "variants.inventory_items.inventory_item_id"],
      filters: { deleted_at: null },
      pagination: { skip: 0, take: 5_000 },
    }),
    query.graph({ entity: "inventory_level", fields: ["inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"], pagination: { skip: 0, take: 10_000 } }),
    query.graph({ entity: "order", fields: ["id", "status", "created_at", "canceled_at", "metadata", "*items", "*items.variant", "*items.variant.product"], pagination: { skip: 0, take: 10_000 } }),
  ])

  const catalog = filterEligibleCatalog(products as GraphProduct[], levels as CatalogInventoryLevel[], locationId)
  const eligibleProductIds = new Set(catalog.included.map((product) => product.id))
  const online = onlineSales(orders as GraphOrder[])
  const ranking = aggregateBestSellers({
    online,
    physical: physical.events,
    links: [],
    eligibleProductIds,
    physicalSourceAvailable: physical.available,
  })

  res.json({
    available: ranking.available,
    reason: ranking.available ? undefined : ranking.reason,
    window_start: ranking.windowStart,
    window_end: ranking.windowEnd,
    products: ranking.products.map((product) => ({ id: product.productId })),
  })
}
