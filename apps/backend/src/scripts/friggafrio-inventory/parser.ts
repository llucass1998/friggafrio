import { ParsedRow } from "./types"
import path from "path"

export function parseSpreadsheet(filePath: string): ParsedRow[] {
  // Use require with absolute path to avoid tampering with main package.json
  const xlsxPath = path.resolve("C:/Users/lluca/Documents/Codex/friggafrio-inventory-data/node_modules/xlsx")
  const xlsx = require(xlsxPath)

  const workbook = xlsx.readFile(filePath)
  const expectedSheets = ["GAS", "EMBRACO", "ELGIN", "TECUMSEH", "COBRE"]

  const rows: ParsedRow[] = []

  for (const sheetName of workbook.SheetNames) {
    if (!expectedSheets.includes(sheetName)) {
      continue // Skip unknown sheets
    }

    const worksheet = workbook.Sheets[sheetName]
    const rawData = xlsx.utils.sheet_to_json(worksheet, { defval: null })

    for (const raw of rawData as any[]) {
      const codigo = raw["CODIGO"] || raw["CÓDIGO"]
      if (!codigo) continue // Skip empty rows

      rows.push({
        sheetName,
        codigo: String(codigo),
        descricao: String(raw["DESCRIÇAO"] || raw["DESCRIÇÃO"] || ""),
        unidade: String(raw["UNIDADE"] || ""),
        quantidade: raw["QUANTIDADE"] ?? null,
        valor: raw["VALOR"] ?? null
      })
    }
  }

  return rows
}
