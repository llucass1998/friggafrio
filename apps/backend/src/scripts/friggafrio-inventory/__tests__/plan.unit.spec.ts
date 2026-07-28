import { generatePlan } from "../plan"
import { PricedRow, BackupData } from "../types"

describe("Plan", () => {
  const mockMedusaState: BackupData = {
    timestamp: "",
    environment: "test",
    products: [],
    variants: [
      { id: "v1", sku: "EXISTING_1", product_id: "p1" },
      { id: "v2", sku: "DUPLICATE_MEDUSA", product_id: "p2" },
      { id: "v3", sku: "DUPLICATE_MEDUSA", product_id: "p3" },
      { id: "v4", sku: "ONLY_IN_MEDUSA", product_id: "p4" }
    ],
    inventoryItems: [],
    inventoryLevels: [],
    stockLocations: [],
    salesChannels: [],
    collections: [],
    categories: []
  }

  it("creates CREATE plan for new SKU", () => {
    const row: PricedRow = {
      sheetName: "GAS", sku: "NEW_1", title: "A", originalUnit: "UN", unitType: "unit",
      quantity: 10, cost: 10, costStatus: "VALID", suggestedPrice: 13
    }
    const plan = generatePlan([row], mockMedusaState)
    const item = plan.find(p => p.sku === "NEW_1")
    expect(item?.action).toBe("CREATE")
  })

  it("creates UPDATE plan for existing SKU", () => {
    const row: PricedRow = {
      sheetName: "GAS", sku: "EXISTING_1", title: "A", originalUnit: "UN", unitType: "unit",
      quantity: 10, cost: 10, costStatus: "VALID", suggestedPrice: 13
    }
    const plan = generatePlan([row], mockMedusaState)
    const item = plan.find(p => p.sku === "EXISTING_1")
    expect(item?.action).toBe("UPDATE")
  })

  it("blocks spreadsheet duplicate SKUs", () => {
    const row1: PricedRow = {
      sheetName: "GAS", sku: "DUP_SHEET", title: "A", originalUnit: "UN", unitType: "unit",
      quantity: 10, cost: 10, costStatus: "VALID", suggestedPrice: 13
    }
    const row2: PricedRow = {
      ...row1
    }
    const plan = generatePlan([row1, row2], mockMedusaState)
    const item = plan.find(p => p.sku === "DUP_SHEET")
    expect(item?.action).toBe("BLOCKED_DUPLICATE_SKU")
  })

  it("identifies CONFLICT for Medusa duplicate SKUs", () => {
    const row: PricedRow = {
      sheetName: "GAS", sku: "DUPLICATE_MEDUSA", title: "A", originalUnit: "UN", unitType: "unit",
      quantity: 10, cost: 10, costStatus: "VALID", suggestedPrice: 13
    }
    const plan = generatePlan([row], mockMedusaState)
    const item = plan.find(p => p.sku === "DUPLICATE_MEDUSA")
    expect(item?.action).toBe("CONFLICT")
  })

  it("identifies UNKNOWN_REFERENCE for Medusa variant not in sheet", () => {
    const plan = generatePlan([], mockMedusaState)
    const item = plan.find(p => p.sku === "ONLY_IN_MEDUSA")
    expect(item?.action).toBe("UNKNOWN_REFERENCE")
  })

  it("deactivates when existing SKU has invalid cost or quantity 0", () => {
    const row: PricedRow = {
      sheetName: "GAS", sku: "EXISTING_1", title: "A", originalUnit: "UN", unitType: "unit",
      quantity: 0, cost: null, costStatus: "MISSING", suggestedPrice: null
    }
    const plan = generatePlan([row], mockMedusaState)
    const item = plan.find(p => p.sku === "EXISTING_1")
    expect(item?.action).toBe("DEACTIVATE")
    expect(item?.reasons).toContain("Custo inválido ou ausente: MISSING")
    expect(item?.reasons).toContain("Quantidade zerada: produto inativo/draft.")
  })
})
