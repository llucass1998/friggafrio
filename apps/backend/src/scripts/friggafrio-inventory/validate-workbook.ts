import { mapRequiredColumns } from "./normalize-header"
import { ParsedSheet } from "./parse-workbook"
import { ValidatedSheetRow } from "./types"

export type ValidateWorkbookResult = {
  validRows: ValidatedSheetRow[]
  errors: string[]
}

export function validateWorkbook(parsedSheets: ParsedSheet[]): ValidateWorkbookResult {
  const validRows: ValidatedSheetRow[] = []
  const errors: string[] = []

  for (const sheet of parsedSheets) {
    if (sheet.rows.length === 0) continue

    // Use headers from the first row (assuming all rows in sheet have same headers, xlsx ensures this)
    const headers = Object.keys(sheet.rows[0])

    let columnMap;
    try {
      columnMap = mapRequiredColumns(headers)
    } catch (e: any) {
      errors.push(`Sheet ${sheet.sheetName}: ${e.message}`)
      continue
    }

    if (!columnMap.codigoKey) errors.push(`Sheet ${sheet.sheetName}: Missing CODIGO column`)
    if (!columnMap.descricaoKey) errors.push(`Sheet ${sheet.sheetName}: Missing DESCRICAO column`)
    if (!columnMap.unidadeKey) errors.push(`Sheet ${sheet.sheetName}: Missing UNIDADE column`)
    if (!columnMap.quantidadeKey) errors.push(`Sheet ${sheet.sheetName}: Missing QUANTIDADE column`)
    if (!columnMap.valorKey) errors.push(`Sheet ${sheet.sheetName}: Missing VALOR column`)

    // Se faltou alguma obrigatória, pula a aba
    if (
      !columnMap.codigoKey ||
      !columnMap.descricaoKey ||
      !columnMap.unidadeKey ||
      !columnMap.quantidadeKey ||
      !columnMap.valorKey
    ) {
      continue
    }

    const seenSkus = new Set<string>()

    for (let i = 0; i < sheet.rows.length; i++) {
      const rawRow = sheet.rows[i]
      const rowNumber = i + 2 // 1-based, plus 1 for header

      const sku = String(rawRow[columnMap.codigoKey]).trim()

      if (!sku || sku === "undefined" || sku === "null") {
        errors.push(`Sheet ${sheet.sheetName} Row ${rowNumber}: Missing SKU`)
        continue
      }

      if (seenSkus.has(sku)) {
        errors.push(`Sheet ${sheet.sheetName} Row ${rowNumber}: Duplicate SKU ${sku}`)
        continue
      }
      seenSkus.add(sku)

      const title = rawRow[columnMap.descricaoKey]
      if (title === undefined || title === null || String(title).trim() === "") {
        errors.push(`Sheet ${sheet.sheetName} Row ${rowNumber}: Missing Title for SKU ${sku}`)
        continue
      }

      const unit = rawRow[columnMap.unidadeKey]
      if (unit === undefined || unit === null || String(unit).trim() === "") {
        errors.push(`Sheet ${sheet.sheetName} Row ${rowNumber}: Missing Unit for SKU ${sku}`)
        continue
      }

      validRows.push({
        sheetName: sheet.sheetName,
        rowNumber,
        codigo: sku,
        descricao: String(title),
        unidade: String(unit),
        quantidade: rawRow[columnMap.quantidadeKey] as string | number,
        valor: rawRow[columnMap.valorKey] as string | number | null,
      })
    }
  }

  return {
    validRows,
    errors,
  }
}
