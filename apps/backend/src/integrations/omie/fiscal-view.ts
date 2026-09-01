import type { FiscalOrderRecord } from "./fiscal-types"
import { sanitizeFiscalReference } from "./fiscal-documents"

export type FiscalAdminView = {
  order_id: string
  state: FiscalOrderRecord["state"]
  integration_code: string
  omie_sales_order_id: string | null
  nfe: FiscalOrderRecord["nfe"]
  attempts: number
  last_error: string | null
}

export type FiscalCustomerView = {
  order_id: string
  state: FiscalOrderRecord["state"]
  nfe: FiscalOrderRecord["nfe"]
}

export const toFiscalAdminView = (record: FiscalOrderRecord): FiscalAdminView => ({
  order_id: record.medusa_order_id,
  state: record.state,
  integration_code: record.integration_code,
  omie_sales_order_id: record.omie_sales_order_id,
  nfe: sanitizeFiscalReference(record.nfe),
  attempts: record.attempts,
  last_error: record.last_error,
})

export const toFiscalCustomerView = (record: FiscalOrderRecord): FiscalCustomerView => ({
  order_id: record.medusa_order_id,
  state: record.state,
  nfe: sanitizeFiscalReference(record.nfe),
})
