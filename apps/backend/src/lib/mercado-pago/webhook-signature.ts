import { createHmac, timingSafeEqual } from "node:crypto"

type Headers = Record<string, string | string[] | undefined>
const firstHeader = (headers: Headers, name: string): string | null => {
  const value = headers[name] ?? headers[name.toLowerCase()]
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? null : null
}
const signatureParts = (signature: string): { ts: string; v1: string } | null => {
  const pairs = signature.split(",").reduce<Record<string, string>>((result, entry) => {
    const [key, value] = entry.trim().split("=", 2)
    if (key && value) result[key] = value
    return result
  }, {})
  return pairs.ts && pairs.v1 ? { ts: pairs.ts, v1: pairs.v1 } : null
}
export const mercadoPagoWebhookManifest = (dataId: string, requestId: string, timestamp: string): string => `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`
export const verifyMercadoPagoWebhookSignature = ({ headers, dataId, secret, now = Date.now(), maxAgeMs = 5 * 60 * 1000 }: { headers: Headers; dataId: string; secret: string | undefined; now?: number; maxAgeMs?: number }): boolean => {
  const signature = firstHeader(headers, "x-signature")
  const requestId = firstHeader(headers, "x-request-id")
  if (!signature || !requestId || !secret || !dataId) return false
  const parts = signatureParts(signature)
  if (!parts || !/^\d+$/.test(parts.ts) || Math.abs(now - Number(parts.ts)) > maxAgeMs) return false
  const expected = createHmac("sha256", secret).update(mercadoPagoWebhookManifest(dataId, requestId, parts.ts), "utf8").digest("hex")
  const received = Buffer.from(parts.v1, "hex")
  const computed = Buffer.from(expected, "hex")
  return received.length === computed.length && timingSafeEqual(received, computed)
}
