import { BackupData, PlanItem, PlanAction, PricedRow } from "./types"

export function generatePlan(rows: PricedRow[], medusaState: BackupData): PlanItem[] {
  const plan: PlanItem[] = []

  // Map Medusa variants by SKU
  const variantsBySku = new Map<string, any[]>()
  for (const variant of medusaState.variants) {
    if (!variant.sku) continue
    const list = variantsBySku.get(variant.sku) || []
    list.push(variant)
    variantsBySku.set(variant.sku, list)
  }

  // Find spreadsheet duplicate SKUs
  const sheetSkus = new Set<string>()
  const duplicateSheetSkus = new Set<string>()
  for (const row of rows) {
    if (sheetSkus.has(row.sku)) duplicateSheetSkus.add(row.sku)
    sheetSkus.add(row.sku)
  }

  const processedSkus = new Set<string>()

  for (const row of rows) {
    if (processedSkus.has(row.sku)) continue
    processedSkus.add(row.sku)

    const reasons: string[] = []
    const existingVariants = variantsBySku.get(row.sku) || []

    // Hard blocks
    if (!row.sku) {
      plan.push({
        sku: row.sku,
        action: "BLOCKED_INVALID_ROW",
        pricedRow: row,
        reasons: ["SKU vazio."]
      })
      continue
    }

    if (duplicateSheetSkus.has(row.sku)) {
      plan.push({
        sku: row.sku,
        action: "BLOCKED_DUPLICATE_SKU",
        pricedRow: row,
        reasons: ["SKU duplicado na planilha oficial."]
      })
      continue
    }

    if (existingVariants.length > 1) {
      plan.push({
        sku: row.sku,
        action: "CONFLICT",
        pricedRow: row,
        reasons: ["SKU duplicado no catálogo do Medusa."]
      })
      continue
    }

    // Soft blocks and deactivation reasons
    if (row.costStatus !== "VALID") {
      reasons.push(`Custo inválido ou ausente: ${row.costStatus}`)
    }
    if (row.quantity === 0) {
      reasons.push("Quantidade zerada: produto inativo/draft.")
    }
    if (row.quantity < 0) {
      reasons.push(`Quantidade negativa: ${row.quantity}. Classificado como NEGATIVE_STOCK. Estoque operacional = 0.`)
    }
    if (row.unitType === "kg") {
      reasons.push("Estratégia fracionada (KG) pendente de validação técnica de suporte decimal no Medusa.")
    }

    let action: PlanAction
    if (existingVariants.length === 1) {
      action = reasons.length > 0 ? "DEACTIVATE" : "UPDATE"
    } else {
      // New product from sheet
      action = "CREATE"
    }

    plan.push({
      sku: row.sku,
      action,
      pricedRow: row,
      existingProduct: existingVariants[0]?.product_id ?? undefined,
      reasons
    })
  }

  // Process Medusa variants not in spreadsheet
  for (const [sku, variants] of variantsBySku.entries()) {
    if (!processedSkus.has(sku)) {
      if (variants.length > 1) {
        plan.push({
          sku,
          action: "CONFLICT",
          reasons: ["SKU duplicado no Medusa, ausente na planilha."]
        })
      } else {
        plan.push({
          sku,
          action: "UNKNOWN_REFERENCE",
          existingProduct: variants[0].product_id,
          reasons: ["SKU ausente na planilha. Referência histórica desconhecida. Não remover sem aprovação."]
        })
      }
    }
  }

  // Deterministic sort by SKU
  return plan.sort((a, b) => a.sku.localeCompare(b.sku))
}
