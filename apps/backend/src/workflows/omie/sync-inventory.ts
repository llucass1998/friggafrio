import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createInventoryLevelsWorkflow, updateInventoryLevelsWorkflow } from "@medusajs/medusa/core-flows"
import { OmieClient, OmieStockReader, calculateAvailableStock, loadOmieConfig, normalizeOmieStock } from "../../integrations/omie"

export interface SyncInventoryInput { sku?: string; externalId?: string; locationCode?: number; pageSize?: number; maxPages?: number }
export interface InventoryResult { updated: number; created?: number; skipped?: boolean; reason?: string }

export async function syncInventory(input: SyncInventoryInput, container: MedusaContainer): Promise<InventoryResult> {
  const config = loadOmieConfig()
  if (!config) return { updated: 0, skipped: true, reason: "missing_credentials" }
  const locations: Record<string, string> = JSON.parse(process.env.OMIE_STOCK_LOCATION_MAP ?? "{}")
  if (!Object.keys(locations).length) throw new Error("OMIE_STOCK_LOCATION_MAP_REQUIRED")
  const client = new OmieClient(config)
  const reader = new OmieStockReader(client)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  let updated = 0
  let created = 0
  for (const [code, locationId] of Object.entries(locations)) {
    if (input.locationCode && String(input.locationCode) !== code) continue
    const { data: foundLocations } = await query.graph({ entity: "stock_location", fields: ["id"], filters: { id: locationId } })
    if (!foundLocations.length) throw new Error("OMIE_STOCK_LOCATION_UNRESOLVED")
    let page = 1
    let hasMore = true
    while (hasMore) {
      if (page > (input.maxPages ?? 200)) throw new Error("OMIE_STOCK_PAGINATION_INCOMPLETE")
      const result = input.sku || input.externalId
        ? { records: [normalizeOmieStock(await client.request<Record<string, unknown>>("ObterEstoqueProduto", {
          ...(input.externalId ? { nCodProd: Number(input.externalId) } : { cCodigo: input.sku }), codigo_local_estoque: Number(code),
        }))], hasMore: false }
        : await reader.readPage(page, { locationCode: Number(code), pageSize: input.pageSize ?? 50 })
      for (const record of result.records) {
        if (!record.sku || record.physical === null || record.reserved === null || record.reserved < 0 || ["INVALID", "MISSING"].includes(record.state)) continue
        if (record.locationCode && record.locationCode !== code) throw new Error("OMIE_STOCK_LOCATION_MISMATCH")
        const { data: variants } = await query.graph({ entity: "product_variant", filters: { sku: record.sku }, fields: ["id", "inventory_items.inventory_item_id"] })
        if (variants.length !== 1 || !variants[0]?.inventory_items?.length || !variants[0].inventory_items[0]) continue
        const itemId = variants[0].inventory_items[0].inventory_item_id
        if (!itemId) continue
        const { data: levels } = await query.graph({ entity: "inventory_level", filters: { inventory_item_id: itemId, location_id: locationId }, fields: ["id", "stocked_quantity", "reserved_quantity"] })
        const level = levels[0]
        const available = calculateAvailableStock(record.physical, record.reserved)
        // Medusa subtrai suas próprias reservas; somá-las evita descontá-las duas vezes.
        const stocked = available + Number(level?.reserved_quantity ?? 0)
        if (level) {
          if (Number(level.stocked_quantity) !== stocked) {
            await updateInventoryLevelsWorkflow(container).run({ input: { updates: [{ inventory_item_id: itemId, location_id: locationId, stocked_quantity: stocked }] } })
            updated++
          }
        } else {
          await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: [{ inventory_item_id: itemId, location_id: locationId, stocked_quantity: stocked }] } })
          created++
        }
      }
      hasMore = result.hasMore
      page++
    }
  }
  return { updated, created }
}
export const syncOmieInventoryStep = createStep("sync-omie-inventory",
  async (input: SyncInventoryInput, { container }): Promise<StepResponse<InventoryResult>> => new StepResponse(await syncInventory(input, container)))
export const syncOmieInventoryWorkflow = createWorkflow("sync-omie-inventory", (input: SyncInventoryInput) => new WorkflowResponse(syncOmieInventoryStep(input)))
