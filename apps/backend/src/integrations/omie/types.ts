export type OmieRecord = Record<string, unknown>

export interface OmieClientConfig {
  apiUrl: string
  appKey: string
  appSecret: string
  timeoutMs?: number
  maxAttempts?: number
  baseBackoffMs?: number
}

export interface OmieRequestPayload {
  call: string
  app_key: string
  app_secret: string
  param: readonly OmieRecord[]
}

export interface OmieLogger {
  debug?: (message: string, context?: Record<string, unknown>) => void
  warn?: (message: string, context?: Record<string, unknown>) => void
}

export interface OmieTransportDependencies {
  fetchImpl?: typeof fetch
  sleep?: (milliseconds: number) => Promise<void>
  random?: () => number
  logger?: OmieLogger
}

export type OmieErrorCode =
  | "CONFIGURATION"
  | "TIMEOUT"
  | "NETWORK"
  | "RATE_LIMITED"
  | "UPSTREAM"
  | "INVALID_RESPONSE"
  | "READ_ONLY_VIOLATION"

export interface OmieClientErrorOptions {
  code: OmieErrorCode
  operation: string
  status?: number
  retryable?: boolean
  cause?: unknown
}

export interface OmieProductRecord extends OmieRecord {
  [key: string]: unknown
}

export interface OmieCatalogPage {
  products: OmieProductRecord[]
  page: number
  pageSize: number
  hasMore: boolean
}

export interface NormalizedPrice {
  amount: number | null
  currency: string | null
  sourceField: string | null
}

export interface NormalizedInventory {
  quantity: number | null
  location: string | null
  sourceField: string | null
}

export type CommercialStatus = "SELLABLE" | "QUOTE_ONLY"

export interface CommercialApproval {
  product: boolean
  price: boolean
  inventory: boolean
  fiscal: boolean
  shipping: boolean
}

export interface NormalizedVariant {
  externalId: string | null
  title: string | null
  sku: string | null
  weight: number | null
  weightUnit: string | null
  shippingProfile: string | null
  fiscalCode: string | null
  price: NormalizedPrice
  inventory: NormalizedInventory
  commercialStatus: CommercialStatus
}

export interface NormalizedProduct {
  externalId: string | null
  title: string | null
  handle: string | null
  category: string | null
  tags: string[]
  image: string | null
  variants: NormalizedVariant[]
  approval: CommercialApproval
  commercialStatus: CommercialStatus
  source: "omie"
}

export type SyncOperation = "create" | "update" | "no-op" | "conflict"

export interface SyncPlanItem {
  operation: SyncOperation
  externalId: string | null
  sku: string | null
  reason: string
}

export interface CatalogSyncPlan {
  dryRun: true
  items: SyncPlanItem[]
}
