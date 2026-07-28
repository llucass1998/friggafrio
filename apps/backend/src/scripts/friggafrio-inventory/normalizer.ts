import { ParsedRow, NormalizedRow, CostStatus } from "./types"

function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return ""
  return String(value).trim().replace(/\s+/g, " ")
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number") return value

  let str = String(value).trim()
  str = str.replace(/^R\$\s*/i, "")

  if (/^-?[0-9]+(\.[0-9]{3})*(,[0-9]+)?$/.test(str) || /^-?[0-9]+,[0-9]+$/.test(str)) {
      const clean = str.replace(/\./g, "").replace(",", ".")
      const parsed = parseFloat(clean)
      return isNaN(parsed) ? null : parsed
  }

  const parsed = parseFloat(str)
  return isNaN(parsed) ? null : parsed
}

export function normalizeRow(row: ParsedRow): NormalizedRow {
  const sku = normalizeString(row.codigo)
  const title = normalizeString(row.descricao)
  const originalUnit = normalizeString(row.unidade)

  let unitType: "unit" | "can" | "kg" | "unknown" = "unknown"
  const upperUnit = originalUnit.toUpperCase()
  if (["PC", "PÇ", "PEÇA", "UN", "UNID"].includes(upperUnit)) {
    unitType = "unit"
  } else if (upperUnit === "LATA") {
    unitType = "can"
  } else if (upperUnit === "KG") {
    unitType = "kg"
  }

  const quantity = parseNumber(row.quantidade) ?? 0

  let cost: number | null = null
  let costStatus: CostStatus = "VALID"

  if (row.valor === null || row.valor === undefined || row.valor === "") {
    costStatus = "MISSING"
  } else {
    cost = parseNumber(row.valor)
    if (cost === null || isNaN(cost)) {
      costStatus = "INVALID"
    } else if (cost < 0) {
      costStatus = "INVALID"
    } else if (cost === 0) {
      costStatus = "ZERO"
    } else if (cost === 1) {
      costStatus = "SUSPICIOUS"
    }
  }

  return {
    sheetName: row.sheetName,
    sku,
    title,
    originalUnit,
    unitType,
    quantity,
    cost,
    costStatus
  }
}
