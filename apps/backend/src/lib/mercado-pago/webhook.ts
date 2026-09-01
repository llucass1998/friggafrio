import { createHash } from "node:crypto"
import { verifyMercadoPagoWebhookSignature } from "./webhook-signature"

export type MercadoPagoWebhookNotification = { action?: unknown; type?: unknown; data?: { id?: unknown } }
export type MercadoPagoWebhookEvent = { providerEventId: string; providerPaymentId: string; eventType: string; requestId: string | null; payloadHash: string }
const header = (headers: Record<string, unknown>, key: string): string | null => {
  const value = headers[key] ?? headers[key.toLowerCase()]
  return typeof value === "string" ? value : Array.isArray(value) && typeof value[0] === "string" ? value[0] : null
}
export const parseMercadoPagoWebhook = ({ body, rawBody, headers, secret }: { body: MercadoPagoWebhookNotification; rawBody: string | Buffer; headers: Record<string, unknown>; secret: string | undefined }): MercadoPagoWebhookEvent | null => {
  const resourceId = typeof body.data?.id === "string" ? body.data.id : ""
  const action = typeof body.action === "string" ? body.action : typeof body.type === "string" ? body.type : ""
  if (!resourceId || !action || !verifyMercadoPagoWebhookSignature({ headers: headers as Record<string, string | string[] | undefined>, dataId: resourceId, secret })) return null
  return {
    providerEventId: createHash("sha256").update(`mercado-pago:${action}:${resourceId}`).digest("hex"),
    providerPaymentId: resourceId,
    eventType: action,
    requestId: header(headers, "x-request-id"),
    payloadHash: createHash("sha256").update(rawBody).digest("hex"),
  }
}
