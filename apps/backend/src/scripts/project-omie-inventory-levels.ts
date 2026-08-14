import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
} from "@medusajs/medusa/core-flows"
import { buildOmieInventoryProjectionPlan, type InventoryLevelSnapshot, type OmieInventoryProjectionSource } from "../utils/omie-inventory-projection"

const STOCK_LOCATION_NAME = "FriggaFrio - Loja 1 / Matriz"
const BATCH_SIZE = 100
const applyRequested = () => process.env.OMIE_INVENTORY_PROJECTION_APPLY === "true"

type Query = {
  graph: (input: { entity: string; fields: string[]; filters?: Record<string, unknown> }) => Promise<{ data: unknown[] }>
}

/**
 * Replays explicitly observed Gate 5 Omie stock into physical Medusa levels.
 * It never reads Omie or infers missing data, and updates only stocked
 * quantity so Medusa's reserved quantity remains transactional.
 */
export default async function projectOmieInventoryLevels({ container }: ExecArgs): Promise<void> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as Query
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const [{ data: locations }, { data: products }] = await Promise.all([
    query.graph({ entity: "stock_location", fields: ["id", "name"] }),
    query.graph({
      entity: "product",
      fields: ["id", "metadata", "variants.id", "variants.inventory_items.inventory_item_id"],
      filters: { deleted_at: null },
    }),
  ])

  const matchingLocations = locations.filter((location) =>
    (location as { name?: unknown }).name === STOCK_LOCATION_NAME,
  ) as Array<{ id?: string }>
  if (matchingLocations.length !== 1 || !matchingLocations[0]?.id) {
    throw new Error("OMIE_INVENTORY_STOCK_LOCATION_UNRESOLVED")
  }
  const locationId = matchingLocations[0].id
  const { data: levels } = await query.graph({
    entity: "inventory_level",
    fields: ["id", "inventory_item_id", "location_id"],
    filters: { location_id: locationId },
  })
  const omieProducts = (products as OmieInventoryProjectionSource[]).filter(
    (product) => product.metadata?.source === "omie",
  )
  const plan = buildOmieInventoryProjectionPlan(omieProducts, locationId, levels as InventoryLevelSnapshot[])
  const creates = plan.projections.filter((projection) => projection.operation === "create")
  const updates = plan.projections.filter((projection) => projection.operation === "update")
  logger.info(`[omie-inventory-projection] mode=${applyRequested() ? "apply" : "dry-run"} products=${omieProducts.length} create=${creates.length} update=${updates.length} skip=${plan.skipped.length}`)
  if (!applyRequested()) return
  if (plan.skipped.length) throw new Error(`OMIE_INVENTORY_PROJECTION_INCOMPLETE:${plan.skipped[0].reason}`)

  for (let offset = 0; offset < creates.length; offset += BATCH_SIZE) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: creates.slice(offset, offset + BATCH_SIZE).map((projection) => ({
        inventory_item_id: projection.inventoryItemId,
        location_id: projection.locationId,
        stocked_quantity: projection.stockedQuantity,
      })) },
    })
  }
  for (let offset = 0; offset < updates.length; offset += BATCH_SIZE) {
    await updateInventoryLevelsWorkflow(container).run({
      input: { updates: updates.slice(offset, offset + BATCH_SIZE).map((projection) => ({
        inventory_item_id: projection.inventoryItemId,
        location_id: projection.locationId,
        stocked_quantity: projection.stockedQuantity,
      })) },
    })
  }
  logger.info(`[omie-inventory-projection] applied create=${creates.length} update=${updates.length} reservations_preserved=yes`)
}
