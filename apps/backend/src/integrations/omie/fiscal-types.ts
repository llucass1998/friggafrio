export const FISCAL_STATES = [
  "NOT_ELIGIBLE",
  "PAYMENT_PENDING",
  "READY_FOR_FISCAL_SYNC",
  "VALIDATING_FISCAL_DATA",
  "BLOCKED_MISSING_CONFIGURATION",
  "CUSTOMER_SYNCED",
  "SALES_ORDER_CREATING",
  "SALES_ORDER_CREATED",
  "INVOICE_PENDING",
  "INVOICE_PROCESSING",
  "NFE_AUTHORIZED",
  "NFE_REJECTED",
  "CANCELLATION_PENDING",
  "NFE_CANCELLED",
  "REFUND_RECONCILIATION_PENDING",
  "COMPLETED",
  "ERROR_RETRYABLE",
  "ERROR_PERMANENT",
] as const

export type FiscalState = typeof FISCAL_STATES[number]

export type FiscalEnvironment = "homologation" | "production"

export type FiscalDocument = {
  type: "CPF" | "CNPJ"
  number: string
}

export type FiscalAddress = {
  address_1: string
  city: string
  state: string
  postal_code: string
  country_code: string
  ibge_code?: string | null
  number?: string | null
  neighborhood?: string | null
}

export type FiscalCustomerInput = {
  external_id: string
  name: string
  document: FiscalDocument
  email?: string | null
  phone?: string | null
  address: FiscalAddress
  state_registration?: string | null
  consumer_final: boolean
}

export type FiscalProductInput = {
  sku: string
  omie_code: string
  description: string
  unit: string
  ncm: string | null
  cest?: string | null
  origin: number | null
  cfop: string | null
  cst_csosn: string | null
  tax_scenario: string | null
  weight_grams?: number | null
}

export type FiscalOrderItemInput = {
  sku: string
  quantity: number
  unit_price: number
  discount: number
  product: FiscalProductInput
}

export type FiscalOrderInput = {
  medusa_order_id: string
  customer: FiscalCustomerInput
  items: FiscalOrderItemInput[]
  subtotal: number
  shipping: number
  total: number
  currency_code: string
  payment: {
    status: "pending" | "authorized" | "captured" | "failed" | "canceled" | "refunded"
    method: "pix" | "card"
    installments: number
    provider_payment_id?: string | null
  }
  shipping_method: {
    key: string
    amount: number
    pickup: boolean
    state: string
  }
}

export type FiscalValidationCode =
  | "PAYMENT_NOT_CONFIRMED"
  | "CUSTOMER_DOCUMENT_MISSING"
  | "CUSTOMER_DOCUMENT_INVALID"
  | "CUSTOMER_NAME_MISSING"
  | "CUSTOMER_ADDRESS_MISSING"
  | "CUSTOMER_IBGE_MISSING"
  | "PRODUCT_OMIE_CODE_MISSING"
  | "PRODUCT_SKU_MISSING"
  | "PRODUCT_NCM_MISSING"
  | "PRODUCT_UNIT_MISSING"
  | "PRODUCT_ORIGIN_MISSING"
  | "PRODUCT_CFOP_MISSING"
  | "PRODUCT_CST_CSOSN_MISSING"
  | "PRODUCT_TAX_SCENARIO_MISSING"
  | "ORDER_ITEMS_MISSING"
  | "ORDER_TOTAL_INVALID"
  | "ORDER_CURRENCY_INVALID"
  | "SHIPPING_MAPPING_MISSING"
  | "SHIPPING_AMOUNT_MISMATCH"
  | "INSTALLMENTS_INVALID"
  | "NFE_PRODUCTION_BLOCKED"

export type FiscalValidationIssue = {
  code: FiscalValidationCode
  field: string
  message: string
}

export type FiscalValidationResult = {
  valid: boolean
  status: "FISCAL_READY" | "FISCAL_DATA_MISSING" | "MAPPING_MISSING" | "PRICE_INVALID" | "STOCK_INVALID" | "SCENARIO_MISSING" | "ACCOUNTANT_REVIEW_REQUIRED"
  issues: FiscalValidationIssue[]
}

export type FiscalDocumentReference = {
  nfe_id: string | null
  number: string | null
  series: string | null
  access_key: string | null
  authorized_at: string | null
  xml_url: string | null
  danfe_url: string | null
}

export type FiscalOrderRecord = {
  id: string
  medusa_order_id: string
  integration_code: string
  state: FiscalState
  environment: FiscalEnvironment
  omie_customer_id: string | null
  omie_sales_order_id: string | null
  nfe: FiscalDocumentReference
  attempts: number
  last_error: string | null
  external_event_id: string | null
}
