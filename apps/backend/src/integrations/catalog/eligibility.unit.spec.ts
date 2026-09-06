import {
  evaluateCatalogEligibility,
  filterEligibleCatalog,
} from "./eligibility"

const product = (overrides: Record<string, unknown> = {}) => ({
  id: "prod_1",
  status: "published",
  metadata: {
    omie_external_id: "100",
    catalog_homologation_status: "approved",
    purchase_enabled: true,
    omie_unit: "UN",
    ...((overrides.metadata as Record<string, unknown> | undefined) ?? {}),
  },
  categories: [{ handle: "componentes" }],
  variants: [{
    id: "variant_1",
    sku: "SKU-100",
    inventory_items: [{ inventory_item_id: "item_1" }],
    ...((overrides.variant as Record<string, unknown> | undefined) ?? {}),
  }],
  ...overrides,
})

const stock = (quantity = 5, locationId = "loc_1") => [{
  inventory_item_id: "item_1",
  location_id: locationId,
  stocked_quantity: quantity,
  reserved_quantity: 0,
}]

describe("catalog eligibility", () => {
  it("accepts a mapped published product with positive stock at the authorized location", () => {
    expect(evaluateCatalogEligibility(product(), stock(), "loc_1")).toMatchObject({
      eligible: true,
      availableQuantity: 5,
    })
  })

  it("supports Medusa's nested inventory item relation", () => {
    expect(evaluateCatalogEligibility(product(), stock(), "loc_1").reasons).not.toContain("MISSING_VARIANT_MAPPING")
  })

  it("does not require an optional approval marker when the product is otherwise sellable", () => {
    const row = product({ metadata: {
      omie_external_id: "100",
      catalog_homologation_status: undefined,
      purchase_enabled: true,
      omie_unit: "UN",
    } })
    expect(evaluateCatalogEligibility(row, stock(), "loc_1").eligible).toBe(true)
  })

  it("fails closed for missing identifiers, publication, category, unit and stock", () => {
    const result = evaluateCatalogEligibility(product({
      status: "draft",
      metadata: {
        omie_external_id: "",
        catalog_homologation_required: true,
        catalog_homologation_status: "pending",
        purchase_enabled: false,
        omie_unit: "INVALID",
      },
      categories: [],
      variants: [],
    }), [], "loc_1")
    expect(result.eligible).toBe(false)
    expect(result.reasons).toEqual(expect.arrayContaining([
      "MISSING_OMIE_CODE",
      "MISSING_VARIANT_MAPPING",
      "NOT_PUBLISHED",
      "CATEGORY_NOT_ALLOWED",
      "CATALOG_NOT_APPROVED",
      "PURCHASE_DISABLED",
      "NO_POSITIVE_STOCK",
    ]))
  })

  it("keeps optional pending homologation and absent legacy units neutral", () => {
    const row = product({ metadata: {
      omie_external_id: "100",
      catalog_homologation_status: "pending",
      purchase_enabled: true,
    } })
    expect(evaluateCatalogEligibility(row, stock(), "loc_1").eligible).toBe(true)
  })

  it("rejects stock that exists only in another location", () => {
    expect(evaluateCatalogEligibility(product(), stock(10, "loc_2"), "loc_1").reasons).toContain("NO_POSITIVE_STOCK")
  })

  it("rejects duplicate Omie codes and SKUs without mutating products", () => {
    const first = product()
    const second = product({ id: "prod_2" })
    const result = filterEligibleCatalog([first, second], stock(), "loc_1")
    expect(result.included).toHaveLength(0)
    expect(result.excluded.every((entry) => entry.reasons.includes("DUPLICATE_OMIE_CODE"))).toBe(true)
    expect(result.excluded.every((entry) => entry.reasons.includes("DUPLICATE_SKU"))).toBe(true)
  })
})
