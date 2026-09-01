import { setTimeout as delay } from "node:timers/promises"

export type MercadoPagoOrder = { id: string; status: string; external_reference?: string; total_amount?: string; currency?: string; currency_id?: string; transactions?: { payments?: Array<Record<string, unknown>> } }
export type MercadoPagoClientOptions = { accessToken: string; baseUrl?: string; timeoutMs?: number; fetcher?: typeof fetch; random?: () => number }
export class MercadoPagoRequestError extends Error {
  constructor(readonly status: number, readonly category: string, readonly requestId?: string, message = "Mercado Pago request failed") {
    super(message)
    this.name = "MercadoPagoRequestError"
  }
}
const sanitizedCategory = (value: unknown): string | undefined => {
  if (typeof value !== "string" || value.length > 80) return undefined
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_")
}
const errorCategory = (body: Record<string, unknown>): string | undefined => {
  const direct = sanitizedCategory(body.error) ?? sanitizedCategory(body.code) ?? sanitizedCategory(body.cause)
  if (direct) return direct
  if (!Array.isArray(body.errors)) return undefined
  for (const entry of body.errors) {
    if (!entry || typeof entry !== "object") continue
    const record = entry as Record<string, unknown>
    const nested = sanitizedCategory(record.code) ?? sanitizedCategory(record.error) ?? sanitizedCategory(record.cause)
    if (nested) return nested
  }
  return undefined
}
const rejectedOrder = (status: number, body: Record<string, unknown>): MercadoPagoOrder | undefined => {
  if (status !== 402 || !body.data || typeof body.data !== "object") return undefined
  const order = body.data as Record<string, unknown>
  if (typeof order.id !== "string" || !order.id || !["failed", "rejected", "cancelled"].includes(String(order.status))) return undefined
  return order as MercadoPagoOrder
}
export class MercadoPagoClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly fetcher: typeof fetch
  private readonly random: () => number
  constructor(private readonly options: MercadoPagoClientOptions) {
    this.baseUrl = options.baseUrl ?? "https://api.mercadopago.com"
    this.timeoutMs = options.timeoutMs ?? 10_000
    this.fetcher = options.fetcher ?? fetch
    this.random = options.random ?? Math.random
  }
  createOrder(payload: Record<string, unknown>, idempotencyKey: string) { return this.request("POST", "/v1/orders", payload, idempotencyKey) }
  getOrder(id: string) { return this.request("GET", `/v1/orders/${encodeURIComponent(id)}`) }
  updateOrder(id: string, payload: Record<string, unknown>, idempotencyKey: string) { return this.request("PUT", `/v1/orders/${encodeURIComponent(id)}`, payload, idempotencyKey) }
  cancelOrder(id: string, idempotencyKey: string) { return this.request("POST", `/v1/orders/${encodeURIComponent(id)}/cancel`, undefined, idempotencyKey) }
  captureOrder(id: string, idempotencyKey: string) { return this.request("POST", `/v1/orders/${encodeURIComponent(id)}/capture`, undefined, idempotencyKey) }
  refundOrder(id: string, transactionId: string, amount: string, idempotencyKey: string) {
    return this.request("POST", `/v1/orders/${encodeURIComponent(id)}/refund`, {
      transactions: [{ id: transactionId, amount }],
    }, idempotencyKey)
  }
  private async request(method: "GET" | "POST" | "PUT", path: string, body?: Record<string, unknown>, idempotencyKey?: string): Promise<MercadoPagoOrder> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), this.timeoutMs)
      try {
        const response = await this.fetcher(`${this.baseUrl}${path}`, { method, signal: controller.signal, headers: { Authorization: `Bearer ${this.options.accessToken}`, "Content-Type": "application/json", ...(idempotencyKey ? { "X-Idempotency-Key": idempotencyKey } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })
        if (response.status === 429 || response.status >= 500) {
          if (attempt < 2) { const retryAfter = Number(response.headers.get("retry-after")); const backoff = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt + Math.floor(this.random() * 150); await delay(backoff); continue }
        }
        if (!response.ok) {
          const requestId = response.headers.get("x-request-id") || response.headers.get("x-correlation-id") || undefined
          const raw = await response.text()
          let category = "gateway_error"
          let message = "Mercado Pago request failed"
          let parsed: Record<string, unknown> | undefined
          try {
            parsed = JSON.parse(raw) as Record<string, unknown>
            category = errorCategory(parsed) ?? category
            if (typeof parsed.message === "string" && parsed.message.length <= 160) message = parsed.message.replace(/[\r\n]/g, " ")
          } catch {
            // Keep the gateway error opaque when it does not return JSON.
          }
          const declined = parsed && rejectedOrder(response.status, parsed)
          if (declined) return declined
          throw new MercadoPagoRequestError(response.status, category, requestId, message)
        }
        return await response.json() as MercadoPagoOrder
      } catch (error) {
        if (attempt === 2 || error instanceof MercadoPagoRequestError || !(error instanceof Error)) throw error
        await delay(250 * 2 ** attempt + Math.floor(this.random() * 150))
      } finally { clearTimeout(timer) }
    }
    throw new Error("Mercado Pago request retries exhausted")
  }
}
