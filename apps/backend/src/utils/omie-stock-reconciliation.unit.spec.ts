import { normalizeOmieStock } from "../integrations/omie/stock-reader"
import { buildOmieStockReconciliationPlan } from "./omie-stock-reconciliation"

describe("Omie stock reconciliation", () => {
  const source = (physical: unknown, externalId = "100", sku = "SKU-100") =>
    normalizeOmieStock({ nCodProd: externalId, cCodigo: sku, fisico: physical, reservado: 2 })

  it("keeps real zero distinct from missing and invalid stock", () => {
    expect(source(0).state).toBe("REAL_ZERO")
    expect(source(undefined).state).toBe("MISSING")
    expect(source(-1).state).toBe("INVALID")
  })

  it("matches by Omie external id and projects decimal physical quantities", () => {
    const plan = buildOmieStockReconciliationPlan(
      [source(2.5)],
      [{ productId: "prod_1", externalId: "100", sku: "SKU-100", inventoryItemId: "iitem_1" }],
      [],
      "sloc_1",
    )
    expect(plan.projections).toEqual([
      expect.objectContaining({ operation: "create", stockedQuantity: 2.5, inventoryItemId: "iitem_1" }),
    ])
  })

  it("updates stocked quantity without carrying source reservations into Medusa", () => {
    const plan = buildOmieStockReconciliationPlan(
      [source(8)],
      [{ productId: "prod_1", externalId: "100", sku: "SKU-100", inventoryItemId: "iitem_1" }],
      [{ id: "level_1", inventory_item_id: "iitem_1", location_id: "sloc_1", stocked_quantity: 4 }],
      "sloc_1",
    )
    expect(plan.projections[0]).toMatchObject({ operation: "update", levelId: "level_1", stockedQuantity: 8 })
  })

  it("fails closed for ambiguous source identities", () => {
    const plan = buildOmieStockReconciliationPlan(
      [source(3, "100", "SKU-100"), source(4, "100", "SKU-101")],
      [{ productId: "prod_1", externalId: "100", sku: "SKU-100", inventoryItemId: "iitem_1" }],
      [],
      "sloc_1",
    )
    expect(plan.projections).toHaveLength(0)
    expect(plan.skipped[0]).toMatchObject({ reason: "SOURCE_IDENTITY_AMBIGUOUS" })
  })

  it("does not move an inventory item across stock locations", () => {
    const plan = buildOmieStockReconciliationPlan(
      [source(3)],
      [{ productId: "prod_1", externalId: "100", sku: "SKU-100", inventoryItemId: "iitem_1" }],
      [{ id: "level_1", inventory_item_id: "iitem_1", location_id: "other_location", stocked_quantity: 3 }],
      "sloc_1",
    )
    expect(plan.projections).toHaveLength(0)
    expect(plan.skipped[0]).toMatchObject({ reason: "INVENTORY_ITEM_ALREADY_MAPPED_TO_OTHER_LOCATION" })
  })

  it("blocks a stale positive level when the source becomes invalid", () => {
    const plan = buildOmieStockReconciliationPlan(
      [source(-1)],
      [{ productId: "prod_1", externalId: "100", sku: "SKU-100", inventoryItemId: "iitem_1" }],
      [{ id: "level_1", inventory_item_id: "iitem_1", location_id: "sloc_1", stocked_quantity: 3 }],
      "sloc_1",
    )
    expect(plan.projections).toHaveLength(0)
    expect(plan.skipped[0]).toMatchObject({ reason: "STALE_LEVEL_SOURCE_STOCK_INVALID" })
  })

  it("is idempotent when the existing inventory level already matches the source", () => {
    const args = [
      [source(5)] as const,
      [{ productId: "prod_1", externalId: "100", sku: "SKU-100", inventoryItemId: "iitem_1" }] as const,
      [{ id: "level_1", inventory_item_id: "iitem_1", location_id: "sloc_1", stocked_quantity: 5 }] as const,
      "sloc_1",
    ] as const
    const first = buildOmieStockReconciliationPlan(...args)
    const second = buildOmieStockReconciliationPlan(...args)
    expect(second).toEqual(first)
  })
})
