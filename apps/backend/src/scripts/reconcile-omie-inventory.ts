import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"
import { OmieClient, OmieStockReader, loadOmieConfig } from "../integrations/omie"
import { buildOmieStockReconciliationPlan, type OmieStockLevel, type OmieStockProduct } from "../utils/omie-stock-reconciliation"

const STOCK_LOCATION_NAME = "FriggaFrio - Loja 1 / Matriz"
const DEFAULT_OMIE_STOCK_LOCATION_CODE = 1982255302
const BATCH_SIZE = 100

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

type ProductRow = {
  id: string
  metadata?: Record<string, unknown> | null
  variants?: Array<{
    sku?: string | null
    inventory_items?: Array<{ inventory_item_id?: string | null }> | null
  }> | null
}

type LocationRow = { id?: string; name?: string }

const applyRequested = () => (
  process.env.OMIE_INVENTORY_RECONCILE_APPLY === "true"
  || process.env.OMIE_INVENTORY_PROJECTION_APPLY === "true"
  || process.argv.slice(2).some((value) => value.replace(/^--/, "") === "apply")
)

const dateInBrazil = () => {
  const configured = process.env.OMIE_INVENTORY_POSITION_DATE?.trim()
  if (configured) return configured
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(new Date())
}

export default async function reconcileOmieInventory({ container }: ExecArgs): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const config = loadOmieConfig()
  if (!config) throw new Error("OMIE_CONFIGURATION_MISSING")

  const [{ data: locations }, { data: products }, { data: levels }] = await Promise.all([
    query.graph({ entity: "stock_location", fields: ["id", "name"] }),
    query.graph({ entity: "product", fields: ["id", "metadata", "variants.sku", "variants.inventory_items.inventory_item_id"], filters: { deleted_at: null } }),
    query.graph({ entity: "inventory_level", fields: ["id", "inventory_item_id", "location_id", "stocked_quantity", "reserved_quantity"] }),
  ])

  const matchingLocations = (locations as LocationRow[]).filter((location) => location.name === STOCK_LOCATION_NAME)
  if (matchingLocations.length !== 1 || !matchingLocations[0]?.id) throw new Error("OMIE_INVENTORY_STOCK_LOCATION_UNRESOLVED")
  const locationId = matchingLocations[0].id
  const configuredLocationCode = process.env.OMIE_INVENTORY_LOCATION_CODE?.trim()
  const omieLocationCode = configuredLocationCode ? Number(configuredLocationCode) : DEFAULT_OMIE_STOCK_LOCATION_CODE
  if (!Number.isSafeInteger(omieLocationCode) || omieLocationCode <= 0) throw new Error("OMIE_INVENTORY_LOCATION_CODE_INVALID")

  const source = await new OmieStockReader(new OmieClient({ ...config, timeoutMs: 15_000, maxAttempts: 3 })).readAll({
    pageSize: 50,
    maxPages: 200,
    positionDate: dateInBrazil(),
    locationCode: omieLocationCode,
  })

  const omieProducts: OmieStockProduct[] = (products as ProductRow[])
    .filter((product) => product.metadata?.source === "omie")
    .map((product) => ({
      productId: product.id,
      externalId: typeof product.metadata?.omie_external_id === "string" ? product.metadata.omie_external_id : null,
      sku: product.variants?.[0]?.sku ?? null,
      inventoryItemId: product.variants?.[0]?.inventory_items?.[0]?.inventory_item_id ?? null,
    }))

  const plan = buildOmieStockReconciliationPlan(source, omieProducts, levels as OmieStockLevel[], locationId)
  const creates = plan.projections.filter((projection) => projection.operation === "create")
  const updates = plan.projections.filter((projection) => projection.operation === "update")
  const noOps = plan.projections.filter((projection) => projection.operation === "no-op")
  const sourceCounts = source.reduce((counts, record) => {
    counts[record.state] += 1
    return counts
  }, { REAL_POSITIVE: 0, REAL_ZERO: 0, MISSING: 0, INVALID: 0 })

  const summary = { mode: applyRequested() ? "apply" : "dry-run", date: dateInBrazil(), rows: source.length, sourceCounts, products: omieProducts.length, create: creates.length, update: updates.length, noOp: noOps.length, skipped: plan.skipped.length, skippedReasons: plan.skipped.reduce<Record<string, number>>((counts, item) => { counts[item.reason] = (counts[item.reason] ?? 0) + 1; return counts }, {}) }
  logger.info(`[omie-stock] ${JSON.stringify(summary)}`)
  process.stdout.write(`${JSON.stringify(summary)}\n`)
  const stalePositive = plan.skipped.filter((item) => item.reason.startsWith("STALE_LEVEL_SOURCE_"))
  if (stalePositive.length > 0) {
    throw new Error(`OMIE_INVENTORY_STALE_LEVEL_BLOCKED:${stalePositive[0]?.productId ?? "unknown"}`)
  }
  if (!applyRequested()) return

  for (let offset = 0; offset < creates.length; offset += BATCH_SIZE) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: creates.slice(offset, offset + BATCH_SIZE).map((projection) => ({
          inventory_item_id: projection.inventoryItemId,
          location_id: projection.locationId,
          stocked_quantity: projection.stockedQuantity,
        })),
      },
    })
  }
  for (let offset = 0; offset < updates.length; offset += BATCH_SIZE) {
    await updateInventoryLevelsWorkflow(container).run({
      input: {
        updates: updates.slice(offset, offset + BATCH_SIZE).map((projection) => ({
          inventory_item_id: projection.inventoryItemId,
          location_id: projection.locationId,
          stocked_quantity: projection.stockedQuantity,
        })),
      },
    })
  }

  logger.info(`[omie-stock] applied create=${creates.length} update=${updates.length} no_op=${noOps.length} reservations_preserved=yes omie_writes=0`)
  process.stdout.write(`${JSON.stringify({ applied: true, create: creates.length, update: updates.length, noOp: noOps.length, reservationsPreserved: true, omieWrites: 0 })}\n`)
}
