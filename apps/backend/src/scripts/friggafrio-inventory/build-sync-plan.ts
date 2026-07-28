import { BackupData, CanonicalInventoryProduct, MedusaSyncOperation, MedusaSyncOperationType } from "./types"
import { METADATA_SYNC_VERSION, IMPORT_SOURCE_NAME } from "./config"

export function buildSyncPlan(
  canonicalProducts: CanonicalInventoryProduct[],
  medusaState: BackupData
): MedusaSyncOperation[] {
  const operations: MedusaSyncOperation[] = []

  const medusaProductsBySku = new Map<string, any>()
  for (const product of medusaState.products || []) {
    if (product.variants && product.variants.length > 0) {
      const variant = product.variants[0] // Assume 1:1 mapping product to variant initially
      if (variant.sku) {
        medusaProductsBySku.set(variant.sku, product)
      }
    }
  }

  const sheetSkus = new Set<string>()

  // Process Canonical Products from Sheet
  for (const product of canonicalProducts) {
    sheetSkus.add(product.sku)
    const existingMedusaProduct = medusaProductsBySku.get(product.sku)

    if (!existingMedusaProduct) {
      let action: MedusaSyncOperationType = "CREATE_PRODUCT"
      let reason = "Produto não existe no Medusa"

      if (product.classification !== "VALID") {
         action = "DRAFT_PRODUCT"
         reason = `Produto novo criado em draft: ${product.classification}`
      }

      operations.push({
        sku: product.sku,
        sourceRow: product.sourceRow,
        sheetName: product.sourceSheet,
        desiredState: product,
        action,
        reason,
        newChecksum: product.checksum,
        changedFields: ["ALL"]
      })
      continue
    }

    const existingVariant = existingMedusaProduct.variants?.[0]
    const existingChecksum = existingMedusaProduct.metadata?.source_checksum
    const currentStatus = existingMedusaProduct.status

    if (existingChecksum === product.checksum && product.classification === "VALID" && currentStatus === "published") {
      operations.push({
        sku: product.sku,
        sourceRow: product.sourceRow,
        sheetName: product.sourceSheet,
        currentState: existingMedusaProduct,
        desiredState: product,
        action: "NO_CHANGE",
        reason: "Checksum idêntico e status publicado, nenhuma alteração necessária",
        previousChecksum: existingChecksum,
        newChecksum: product.checksum,
        changedFields: []
      })
      continue
    }

    if (existingChecksum === product.checksum && product.classification !== "VALID" && currentStatus === "draft") {
      operations.push({
        sku: product.sku,
        sourceRow: product.sourceRow,
        sheetName: product.sourceSheet,
        currentState: existingMedusaProduct,
        desiredState: product,
        action: "NO_CHANGE",
        reason: `Checksum idêntico e status em draft (${product.classification}), nenhuma alteração necessária`,
        previousChecksum: existingChecksum,
        newChecksum: product.checksum,
        changedFields: []
      })
      continue
    }

    const changedFields: string[] = []
    if (existingVariant?.title !== product.title) changedFields.push("title")
    if (existingChecksum !== product.checksum) changedFields.push("checksum")

    // Simplification for exercise logic
    if (product.classification !== "VALID" && currentStatus === "published") {
      operations.push({
        sku: product.sku,
        sourceRow: product.sourceRow,
        sheetName: product.sourceSheet,
        currentState: existingMedusaProduct,
        desiredState: product,
        action: "DRAFT_PRODUCT",
        reason: `Ocultando produto devido à classificação: ${product.classification}`,
        previousChecksum: existingChecksum,
        newChecksum: product.checksum,
        changedFields: ["status", ...changedFields]
      })
    } else if (product.classification === "VALID" && currentStatus !== "published") {
      operations.push({
        sku: product.sku,
        sourceRow: product.sourceRow,
        sheetName: product.sourceSheet,
        currentState: existingMedusaProduct,
        desiredState: product,
        action: "PUBLISH_PRODUCT",
        reason: "Produto apto, será publicado",
        previousChecksum: existingChecksum,
        newChecksum: product.checksum,
        changedFields: ["status", ...changedFields]
      })
    } else {
      operations.push({
        sku: product.sku,
        sourceRow: product.sourceRow,
        sheetName: product.sourceSheet,
        currentState: existingMedusaProduct,
        desiredState: product,
        action: "UPDATE_PRODUCT",
        reason: "Campos atualizados",
        previousChecksum: existingChecksum,
        newChecksum: product.checksum,
        changedFields
      })
    }
  }

  // Process Medusa Products NOT in Sheet
  for (const [sku, product] of medusaProductsBySku.entries()) {
    if (!sheetSkus.has(sku)) {
      if (product.metadata?.import_source === IMPORT_SOURCE_NAME) {
         if (product.status !== "archived") {
           operations.push({
             sku,
             currentState: product,
             action: "ARCHIVE_PRODUCT",
             reason: "Produto importado anteriormente ausente da planilha atual",
             changedFields: ["status"]
           })
         }
      } else {
        operations.push({
          sku,
          currentState: product,
          action: "NO_CHANGE",
          reason: "Produto do Medusa não gerenciado pela planilha",
          changedFields: []
        })
      }
    }
  }

  return operations.sort((a, b) => a.sku.localeCompare(b.sku))
}
