import crypto from "crypto"
import { ValidatedSheetRow, CanonicalInventoryProduct, InventoryProductClassification, InventoryProductIssue } from "./types"
import { normalizeUnit } from "./normalize-unit"
import { parseBrazilianMoney } from "./normalize-money"
import { parseQuantity } from "./normalize-quantity"
import { calculateSalePrice } from "./calculate-price"
import { ALLOWED_SHEETS } from "./config"

export function buildChecksum(
  sourceSheet: string,
  sku: string,
  title: string,
  originalUnit: string,
  normalizedQuantity: string,
  normalizedCost: string
): string {
  const data = [sourceSheet, sku, title, originalUnit, normalizedQuantity, normalizedCost].join("|")
  return crypto.createHash("sha256").update(data).digest("hex").toUpperCase()
}

export function normalizeRow(row: ValidatedSheetRow): CanonicalInventoryProduct {
  const issues: InventoryProductIssue[] = []

  const title = String(row.descricao).trim().replace(/\s+/g, " ")
  const sku = String(row.codigo).trim()
  const originalUnit = String(row.unidade).trim()
  const normalizedUnit = normalizeUnit(originalUnit)

  const parsedQuantity = parseQuantity(row.quantidade)
  let normalizedQuantityStr = "0"
  let classification: InventoryProductClassification = "VALID"

  if (parsedQuantity === null || isNaN(parsedQuantity)) {
    issues.push("INVALID_QUANTITY")
    normalizedQuantityStr = "0"
  } else {
    normalizedQuantityStr = parsedQuantity.toString()
    if (parsedQuantity < 0) {
      classification = "NEGATIVE_STOCK"
      normalizedQuantityStr = "0" // For operations it behaves as zero stock
    } else if (normalizedUnit === "kg" && parsedQuantity % 1 !== 0) {
      classification = "KG_STRATEGY_PENDING"
      // Keep decimal value
    }
  }

  const parsedCost = parseBrazilianMoney(row.valor)
  let normalizedCostStr = "null"
  let calculatedSalePriceStr: string | null = null

  if (parsedCost === null) {
    if (classification === "VALID" || classification === "KG_STRATEGY_PENDING") classification = "MISSING_COST"
  } else if (parsedCost === 0) {
    if (classification === "VALID" || classification === "KG_STRATEGY_PENDING") classification = "ZERO_COST"
    normalizedCostStr = "0"
  } else if (parsedCost === 1) {
    if (classification === "VALID" || classification === "KG_STRATEGY_PENDING") classification = "SUSPICIOUS_COST"
    normalizedCostStr = "1"
  } else {
    normalizedCostStr = parsedCost.toString()
    const salePrice = calculateSalePrice(parsedCost)
    if (salePrice !== null) {
      calculatedSalePriceStr = salePrice.toString()
    }
  }

  if (title.toUpperCase().startsWith("CÓPIA DE") || title.toUpperCase().startsWith("COPIA DE")) {
    classification = "POSSIBLE_DUPLICATE"
  }

  const sheetConfig = ALLOWED_SHEETS.find(s => s.sheetName === row.sheetName)
  const collectionTitle = sheetConfig ? sheetConfig.collectionTitle : row.sheetName

  const checksum = buildChecksum(
    row.sheetName,
    sku,
    title,
    originalUnit,
    parsedQuantity?.toString() || "0",
    normalizedCostStr
  )

  return {
    sourceSheet: row.sheetName,
    sourceRow: row.rowNumber,
    sku,
    title,
    originalUnit,
    normalizedUnit,
    sourceQuantity: String(row.quantidade),
    normalizedQuantity: normalizedQuantityStr,
    sourceCost: row.valor === null ? null : String(row.valor),
    calculatedSalePrice: calculatedSalePriceStr,
    collectionTitle,
    checksum,
    classification,
    issues,
  }
}
