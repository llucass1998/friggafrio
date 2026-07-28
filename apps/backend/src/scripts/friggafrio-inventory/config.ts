export type AllowedSheetName = "GAS" | "AGT" | "EMBRACO" | "ELGIN" | "TECUMSEH" | "COBRE"

export type AllowedSheetConfig = {
  sheetName: AllowedSheetName
  collectionTitle: string
  sourceType: "brand" | "category"
}

export const ALLOWED_SHEETS: AllowedSheetConfig[] = [
  { sheetName: "GAS", collectionTitle: "Gás", sourceType: "category" },
  { sheetName: "AGT", collectionTitle: "AGT", sourceType: "brand" },
  { sheetName: "EMBRACO", collectionTitle: "Embraco", sourceType: "brand" },
  { sheetName: "ELGIN", collectionTitle: "Elgin", sourceType: "brand" },
  { sheetName: "TECUMSEH", collectionTitle: "Tecumseh", sourceType: "brand" },
  { sheetName: "COBRE", collectionTitle: "Cobre", sourceType: "category" }
]

export const SPREADSHEET_ID = "1gHTqPeQG8wV_YbkNTS-_dGAqtCXbse3O1VSTQS4VDiI"
export const SPREADSHEET_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=xlsx`

// Constantes
export const MARKUP_MULTIPLIER = 1.30 // 30%
export const METADATA_SYNC_VERSION = "1.0"
export const IMPORT_SOURCE_NAME = "friggafrio-google-sheet"