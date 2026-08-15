import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { updateProductsWorkflow, type UpdateProductsWorkflowInputProducts } from "@medusajs/medusa/core-flows"
import { projectStorefrontCommercialState, type StorefrontCommercialPolicy } from "../utils/storefront-commercial-state"

const STOCK_LOCATION_NAME = "FriggaFrio - Loja 1 / Matriz"
const BATCH_SIZE = 100

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

type ProductRow = {
  id: string
  title?: string | null
  status?: string | null
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    id?: string
    prices?: Array<{ amount?: number | null; currency_code?: string | null }>
    inventory_items?: Array<{ inventory_item_id?: string | null }>
  }> | null
}

type InventoryLevelRow = { inventory_item_id?: string; location_id?: string; stocked_quantity?: number | null; reserved_quantity?: number | null }
type PolicyRow = StorefrontCommercialPolicy & { product_id?: string }
type LocationRow = { id?: string; name?: string }
type ProductUpdate = UpdateProductsWorkflowInputProducts["products"][number]

const applyRequested = () => process.env.STOREFRONT_COMMERCIAL_RECONCILE_APPLY === "true"
  || process.argv.slice(2).some((value) => value.replace(/^--/, "") === "apply")

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`
  if (value && typeof value === "object") {
    return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`
  }
  return JSON.stringify(value)
}

const hasValidPrice = (product: ProductRow): boolean =>
  (product.variants ?? []).some((variant) =>
    (variant.prices ?? []).some((price) => typeof price.amount === "number" && price.amount > 0 && price.currency_code?.toLowerCase() === "brl")
  )

const availableQuantityFor = (product: ProductRow, levels: InventoryLevelRow[], locationId: string): number => {
  const itemIds = new Set((product.variants ?? []).flatMap((variant) =>
    (variant.inventory_items ?? []).map((item) => item.inventory_item_id).filter((value): value is string => Boolean(value))
  ))
  return levels
    .filter((level) => level.location_id === locationId && level.inventory_item_id && itemIds.has(level.inventory_item_id))
    .reduce((total, level) => total + Number(level.stocked_quantity ?? 0) - Number(level.reserved_quantity ?? 0), 0)
}

export default async function reconcileStorefrontCommercialState({ container }: ExecArgs): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const [{ data: locations }, { data: products }, { data: levels }, { data: policies }] = await Promise.all([
    query.graph({ entity: "stock_location", fields: ["id", "name"] }),
    query.graph({ entity: "product", fields: ["id", "title", "status", "metadata", "variants.prices.*", "variants.inventory_items.inventory_item_id"], filters: { deleted_at: null } }),
    query.graph({ entity: "inventory_level", fields: ["inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"] }),
    query.graph({ entity: "product_sales_policy", fields: ["product_id", "is_quote_only", "requires_contact"] }),
  ])
  const matchingLocations = (locations as LocationRow[]).filter((location) => location.name === STOCK_LOCATION_NAME)
  if (matchingLocations.length !== 1 || !matchingLocations[0]?.id) throw new Error("STOREFRONT_COMMERCIAL_STOCK_LOCATION_UNRESOLVED")
  const locationId = matchingLocations[0].id
  const policyByProduct = new Map((policies as PolicyRow[]).filter((policy) => policy.product_id).map((policy) => [policy.product_id as string, policy]))
  const updates: ProductUpdate[] = []
  const counts = { SELLABLE: 0, OUT_OF_STOCK: 0, PRICE_PENDING: 0, QUOTE_ONLY: 0, no_op: 0 }

  for (const product of products as ProductRow[]) {
    const projection = projectStorefrontCommercialState({
      metadata: product.metadata,
      policy: policyByProduct.get(product.id),
      validPrice: hasValidPrice(product),
      availableQuantity: availableQuantityFor(product, levels as InventoryLevelRow[], locationId),
    })
    counts[projection.state] += 1
    const currentMetadata = stableJson(product.metadata ?? {})
    if (currentMetadata === stableJson(projection.metadata) && product.status === ProductStatus.PUBLISHED) {
      counts.no_op += 1
      continue
    }
    updates.push({ id: product.id, status: ProductStatus.PUBLISHED, metadata: projection.metadata })
  }

  const summary = { mode: applyRequested() ? "apply" : "dry-run", products: products.length, updates: updates.length, counts }
  logger.info(`[storefront-commercial-state] ${JSON.stringify(summary)}`)
  process.stdout.write(`${JSON.stringify(summary)}\n`)
  if (!applyRequested() || updates.length === 0) return
  for (let offset = 0; offset < updates.length; offset += BATCH_SIZE) {
    await updateProductsWorkflow(container).run({ input: { products: updates.slice(offset, offset + BATCH_SIZE) } })
  }
  logger.info(`[storefront-commercial-state] applied=${updates.length}`)
  process.stdout.write(`${JSON.stringify({ applied: updates.length })}\n`)
}
