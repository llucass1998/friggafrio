export type OmieRecord = Record<string, unknown>

export interface OmieClientConfig {
  apiUrl: string
  inventoryApiUrl?: string
  baseUrl?: string
  appKey: string
  appSecret: string
  timeoutMs?: number
  maxAttempts?: number
  baseBackoffMs?: number
  writesEnabled?: boolean
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
  | "WRITE_NOT_ALLOWED"
  | "SOAP_FAULT"

export type OmieStockState = "REAL_POSITIVE" | "REAL_ZERO" | "MISSING" | "INVALID"

export interface OmieStockRecord {
  externalId: string | null
  sku: string | null
  internalCode: string | null
  locationCode: string | null
  physical: number | null
  reserved: number | null
  balance: number | null
  pending: number | null
  state: OmieStockState
}

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
  code: string | null
  title: string | null
  sku: string | null
  unit: string | null
  weight: number | null
  weightUnit: string | null
  shippingProfile: string | null
  fiscalCode: string | null
  ncm?: string | null
  cest?: string | null
  ean?: string | null
  netWeight?: number | null
  grossWeight?: number | null
  height?: number | null
  width?: number | null
  length?: number | null
  price: NormalizedPrice
  inventory: NormalizedInventory
  commercialStatus: CommercialStatus
}

export interface NormalizedProduct {
  externalId: string | null
  code: string | null
  title: string | null
  handle: string | null
  unit: string | null
  category: string | null
  tags: string[]
  image: string | null
  variants: NormalizedVariant[]
  approval: CommercialApproval
  commercialStatus: CommercialStatus
  source: "omie"
  technicalAttributes?: OmieTechnicalAttributes
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

export interface OmieTechnicalAttributes {
  brand: string | null
  capacity_btu: number | null
  voltage: string | null
  gas_type: string | null
  inverter: boolean | null
  warranty_days: number | null
  ncm: string | null
  cest: string | null
  ean: string | null
  net_weight: number | null
  gross_weight: number | null
  height: number | null
  width: number | null
  length: number | null
}

export interface OmieCustomerUpsertInput {
  codigo_cliente_integracao: string
  cnpj_cpf: string
  razao_social: string
  nome_fantasia?: string
  email?: string
  telefone1_ddd?: string
  telefone1_numero?: string
  endereco: string
  endereco_numero: string
  complemento?: string
  bairro: string
  cidade_ibge: string
  estado: string
  cep: string
  contribuinte: "S" | "N"
  inscricao_estadual?: string
  tags?: Array<{ tag: string }>
}

export interface OmieOrderItemDet {
  ide: {
    codigo_item_integracao: string
  }
  produto: {
    codigo_produto?: number
    codigo_produto_integracao?: string
    quantidade: number
    valor_unitario: number
    tipo_desconto?: "V" | "P"
    valor_desconto?: number
  }
}

export interface OmieOrderParcela {
  numero_parcela: number
  data_vencimento: string
  valor: number
  percentual: number
}

export interface OmieOrderUpsertInput {
  cabecalho: {
    codigo_cliente?: number
    codigo_cliente_integracao?: string
    codigo_pedido_integracao: string
    data_previsao: string
    etapa: string
    codigo_cenario_impostos?: number
    origem_pedido: string
  }
  det: OmieOrderItemDet[]
  frete?: {
    modalidade: string
    valor_frete: number
    codigo_transportadora?: number
  }
  informacoes_adicionais?: {
    codigo_categoria?: string
    codigo_conta_corrente?: number
    dados_adicionais_nf?: string
  }
  parcelas?: OmieOrderParcela[]
}

export interface OmieInvoiceNotification {
  codigo_pedido: number
  numero_pedido?: string
  codigo_pedido_integracao?: string
  chave_nfe?: string
  numero_nfe?: string
  serie_nfe?: string
  data_emissao?: string
}

export interface OmieDanfeResponse {
  cUrlDanfe?: string
  danfe_url?: string
  cChaveNfe?: string
  status_envio?: string
}

