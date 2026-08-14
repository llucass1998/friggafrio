import { buildOmieInventoryProjectionPlan } from "./omie-inventory-projection"

describe("Omie inventory level projection", () => {
  const source = (quantity: unknown) => ({
    productId: "prod_1",
    metadata: { inventory_quantity_observed: quantity },
    variants: [{ id: "variant_1", inventory_items: [{ inventory_item_id: "iitem_1" }] }],
  })

  it("maps an explicit Omie zero to physical zero instead of treating it as unavailable input", () => {
    expect(buildOmieInventoryProjectionPlan([source(0)], "sloc_1", []).projections).toEqual([
      expect.objectContaining({ operation: "create", stockedQuantity: 0, inventoryItemId: "iitem_1" }),
    ])
  })

  it("updates stocked quantity only, retaining the existing level identity and its reservation state", () => {
    const plan = buildOmieInventoryProjectionPlan([source(3)], "sloc_1", [
      { id: "ilevel_1", inventory_item_id: "iitem_1", location_id: "sloc_1" },
    ])
    expect(plan.projections).toEqual([
      expect.objectContaining({ operation: "update", levelId: "ilevel_1", stockedQuantity: 3 }),
    ])
  })

  it.each([null, undefined, -1, 1.5, "0", Number.NaN])(
    "fails closed for missing or invalid observed stock: %p",
    (quantity) => {
      const plan = buildOmieInventoryProjectionPlan([source(quantity)], "sloc_1", [])
      expect(plan.projections).toHaveLength(0)
      expect(plan.skipped[0]).toMatchObject({ reason: "MISSING_OR_INVALID_OMIE_STOCK" })
    },
  )

  it("does not guess a product-to-inventory split", () => {
    const plan = buildOmieInventoryProjectionPlan([{
      ...source(2),
      variants: [
        { inventory_items: [{ inventory_item_id: "iitem_1" }] },
        { inventory_items: [{ inventory_item_id: "iitem_2" }] },
      ],
    }], "sloc_1", [])
    expect(plan.projections).toHaveLength(0)
    expect(plan.skipped[0]).toMatchObject({ reason: "AMBIGUOUS_VARIANT_MAPPING" })
  })
})
