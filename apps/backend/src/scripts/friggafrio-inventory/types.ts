export type RawRow = {
  CODIGO?: string | number | null
  DESCRIÇAO?: string | null
  UNIDADE?: string | null
  QUANTIDADE?: string | number | null
  VALOR?: string | number | null
}

export type ParsedRow = {
  sheetName: string
  codigo: string
  descricao: string
  unidade: string
  quantidade: string | number
  valor: string | number | null
}

export type CostStatus = "VALID" | "MISSING" | "INVALID" | "ZERO" | "SUSPICIOUS"

export type NormalizedRow = {
  sheetName: string
  sku: string
  title: string
  originalUnit: string
  unitType: "unit" | "can" | "kg" | "unknown"
  quantity: number
  cost: number | null
  costStatus: CostStatus
}

export type PricedRow = NormalizedRow & {
  suggestedPrice: number | null
}

export type PlanAction =
  | "CREATE"
  | "UPDATE"
  | "DEACTIVATE"
  | "ARCHIVE_REQUIRED"
  | "REMOVE_CANDIDATE"
  | "CONFLICT"
  | "UNKNOWN_REFERENCE"
  | "BLOCKED_DUPLICATE_SKU"
  | "BLOCKED_INVALID_ROW"

export type PlanItem = {
  sku: string
  action: PlanAction
  pricedRow?: PricedRow
  existingProduct?: any
  reasons: string[]
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
