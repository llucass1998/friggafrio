import type { FiscalDocumentReference } from "./fiscal-types"

export type FiscalDocumentAccess = {
  orderId: string
  customerId: string
  role: "customer" | "admin"
}

export const canAccessFiscalDocument = (access: FiscalDocumentAccess, ownerCustomerId: string): boolean =>
  access.role === "admin" || (access.role === "customer" && access.customerId === ownerCustomerId)

export const sanitizeFiscalReference = (reference: FiscalDocumentReference): FiscalDocumentReference => ({
  nfe_id: reference.nfe_id ?? null,
  number: reference.number ?? null,
  series: reference.series ?? null,
  access_key: reference.access_key ?? null,
  authorized_at: reference.authorized_at ?? null,
  xml_url: reference.xml_url?.startsWith("/") ? reference.xml_url : null,
  danfe_url: reference.danfe_url?.startsWith("/") ? reference.danfe_url : null,
})

export const privateDocumentHeaders = (): Record<string, string> => ({
  "cache-control": "private, no-store",
  "x-content-type-options": "nosniff",
})
