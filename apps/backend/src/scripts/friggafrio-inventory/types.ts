import { AllowedSheetName } from "./config"

export type NormalizedInventoryUnit = "unit" | "can" | "kg"

export type InventoryProductClassification =
  | "VALID"
  | "NEGATIVE_STOCK"
  | "MISSING_COST"
  | "ZERO_COST"
  | "SUSPICIOUS_COST"
  | "POSSIBLE_DUPLICATE"
  | "KG_STRATEGY_PENDING"

export type InventoryProductIssue =
  | "UNKNOWN_SHEET"
  | "MISSING_MANDATORY_COLUMN"
  | "DUPLICATE_MANDATORY_COLUMN"
  | "MISSING_SKU"
  | "DUPLICATE_SKU"
  | "EMPTY_TITLE"
  | "EMPTY_UNIT"
  | "INVALID_QUANTITY"
  | "AMBIGUOUS_HEADER"

export type RawSheetRow = {
  [key: string]: any
}

export type ValidatedSheetRow = {
  sheetName: AllowedSheetName
  rowNumber: number
  codigo: string
  descricao: string
  unidade: string
  quantidade: string | number
  valor: string | number | null
}

export type CanonicalInventoryProduct = {
  sourceSheet: AllowedSheetName
  sourceRow: number
  sku: string
  title: string
  originalUnit: string
  normalizedUnit: NormalizedInventoryUnit
  sourceQuantity: string
  normalizedQuantity: string
  sourceCost: string | null
  calculatedSalePrice: string | null
  collectionTitle: string
  checksum: string
  classification: InventoryProductClassification
  issues: InventoryProductIssue[]
}

export type MedusaSyncOperationType =
  | "CREATE_PRODUCT"
  | "UPDATE_PRODUCT"
  | "UPDATE_PRICE"
  | "UPDATE_INVENTORY"
  | "PUBLISH_PRODUCT"
  | "DRAFT_PRODUCT"
  | "ARCHIVE_PRODUCT"
  | "NO_CHANGE"
  | "ERROR"

export type MedusaSyncOperation = {
  sku: string
  sourceRow?: number
  sheetName?: AllowedSheetName
  currentState?: any
  desiredState?: Partial<CanonicalInventoryProduct>
  action: MedusaSyncOperationType
  reason: string
  previousChecksum?: string
  newChecksum?: string
  changedFields?: string[]
}

export type InventorySyncJournal = {
  syncId: string
  mode: "dry-run" | "apply"
  sourceSha: string
  startedAt: string
  finishedAt: string
  status: "success" | "failed" | "blocked"
  sourceRows: number
  created: number
  updated: number
  published: number
  drafted: number
  archived: number
  unchanged: number
  errors: number
  warnings: number
}

export type InventorySheetSource =
  | {
      type: "public-xlsx"
      spreadsheetId: string
    }
  | {
      type: "google-service-account"
      spreadsheetId: string
    }

export type BackupData = {
  timestamp: string
  environment: string
  products: any[]
  variants: any[]
  inventoryItems: any[]
  inventoryLevels: any[]
  stockLocations: any[]
  salesChannels: any[]
  collections: any[]
  categories: any[]
}
