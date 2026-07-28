import * as xlsx from "xlsx"
import { AllowedSheetName, ALLOWED_SHEETS } from "./config"
import { RawSheetRow } from "./types"

export type ParsedSheet = {
  sheetName: AllowedSheetName
  rows: RawSheetRow[]
}

export type ParseWorkbookResult = {
  parsedSheets: ParsedSheet[]
  unknownSheets: string[]
}

export function parseWorkbook(buffer: Buffer): ParseWorkbookResult {
  const workbook = xlsx.read(buffer, { type: "buffer" })

  const parsedSheets: ParsedSheet[] = []
  const unknownSheets: string[] = []

  const allowedSheetNames = ALLOWED_SHEETS.map((s) => s.sheetName as string)

  for (const sheetName of workbook.SheetNames) {
    if (!allowedSheetNames.includes(sheetName)) {
      unknownSheets.push(sheetName)
      continue
    }

    const worksheet = workbook.Sheets[sheetName]
    const rows = xlsx.utils.sheet_to_json<RawSheetRow>(worksheet, { defval: null })

    parsedSheets.push({
      sheetName: sheetName as AllowedSheetName,
      rows,
    })
  }

  return {
    parsedSheets,
    unknownSheets,
  }
}
