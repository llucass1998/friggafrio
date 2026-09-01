import { createHash } from "node:crypto"
import type { FiscalOrderInput } from "./fiscal-types"

export const fiscalIntegrationCode = (medusaOrderId: string): string => {
  const normalized = medusaOrderId.trim()
  if (!normalized) throw new Error("Medusa order identifier is required")
  return `FRIGGAFRIO-${normalized}`
}

export const fiscalIdempotencyKeys = (order: FiscalOrderInput): { customer: string; salesOrder: string; invoice: string } => {
  const integrationCode = fiscalIntegrationCode(order.medusa_order_id)
  const digest = createHash("sha256").update(integrationCode).digest("hex")
  return { customer: `customer:${digest}`, salesOrder: `sales-order:${digest}`, invoice: `invoice:${digest}` }
}

export const assertFiscalPayloadSafe = (value: unknown): void => {
  const sensitiveKey = /(?:^|_)(?:pan|cvv|security.?code|card.?number|card.?token|token|access.?token|app.?secret|webhook.?secret)(?:$|_)/i
  const visit = (entry: unknown): boolean => {
    if (!entry || typeof entry !== "object") return false
    if (Array.isArray(entry)) return entry.some(visit)
    return Object.entries(entry).some(([key, nested]) => sensitiveKey.test(key) || visit(nested))
  }
  if (visit(value)) throw new Error("FISCAL_PAYLOAD_CONTAINS_SENSITIVE_FIELD")
}
