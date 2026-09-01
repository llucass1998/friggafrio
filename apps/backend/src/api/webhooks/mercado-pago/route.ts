import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { PAYMENT_WEBHOOK_EVENT_MODULE } from "../../../modules/payment-webhook-event"
import { parseMercadoPagoWebhook } from "../../../lib/mercado-pago/webhook"
import { getPaymentAvailability, sendPaymentUnavailable } from "../../../utils/payment-availability"
import { Modules } from "@medusajs/framework/utils"
import { MERCADO_PAGO_PROVIDER_ID } from "../../../lib/payment-provider-bootstrap"

type WebhookEventService = {
  listPaymentWebhookEvents(filters: Record<string, unknown>): Promise<Array<{ id: string; processing_status?: string }>>
  createPaymentWebhookEvents(input: Record<string, unknown>): Promise<{ id: string }>
  updatePaymentWebhookEvents?(input: Record<string, unknown>): Promise<unknown>
}

type PaymentModuleService = {
  getWebhookActionAndData(input: { provider: string; payload: Record<string, unknown> }): Promise<{ action: string; data?: { session_id?: string; amount?: number } }>
  authorizePaymentSession(id: string, context: Record<string, unknown>): Promise<unknown | null>
  updatePaymentSession(input: {
    id: string
    data: Record<string, unknown>
    amount: number
    currency_code: string
    status: "pending_authorization" | "error" | "canceled"
  }): Promise<unknown>
}

const sandboxConfigured = (): boolean =>
  process.env.MERCADO_PAGO_ENV === "sandbox"
  && Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN)
  && Boolean(process.env.MERCADO_PAGO_WEBHOOK_SECRET)

export const POST = async (request: MedusaRequest, response: MedusaResponse) => {
  const body = (request.body && typeof request.body === "object" ? request.body : {}) as Record<string, unknown>
  const rawBody = String((request as MedusaRequest & { rawBody?: string }).rawBody ?? JSON.stringify(body))
  const parsed = parseMercadoPagoWebhook({
    body,
    rawBody,
    headers: (request.headers ?? {}) as Record<string, unknown>,
    secret: process.env.MERCADO_PAGO_WEBHOOK_SECRET,
  })
  if (!parsed) return response.status(401).json({ error: "invalid_webhook" })
  if (!getPaymentAvailability().processingEnabled || !sandboxConfigured()) return sendPaymentUnavailable(response)

  const events = request.scope.resolve(PAYMENT_WEBHOOK_EVENT_MODULE) as WebhookEventService
  const existing = await events.listPaymentWebhookEvents({ provider: "mercado-pago", provider_event_id: parsed.providerEventId })
  if (existing[0]) return response.status(202).json({ accepted: true, duplicate: true })

  try {
    const event = await events.createPaymentWebhookEvents({
      provider: "mercado-pago",
      provider_event_id: parsed.providerEventId,
      provider_payment_id: parsed.providerPaymentId,
      request_id: parsed.requestId,
      event_type: parsed.eventType,
      signature_validated: true,
      payload_hash: parsed.payloadHash,
      processing_status: "pending",
      attempts: 0,
      received_at: new Date(),
    })
    let processingStage = "resolve_payment_module"
    try {
      const payment = request.scope.resolve(Modules.PAYMENT) as PaymentModuleService | undefined
      if (!payment) return response.status(202).json({ accepted: true })
      processingStage = "get_webhook_action"
      const action = await payment.getWebhookActionAndData({
        // Payment module prefixes provider ids with `pp_` internally.
        provider: MERCADO_PAGO_PROVIDER_ID.replace(/^pp_/, ""),
        payload: { data: body, headers: request.headers ?? {} },
      })
      if (action.action === "not_supported") throw new Error("payment_webhook_not_supported")
      if (action.data?.session_id) {
        const context = {
          webhook_event_id: event.id,
          provider_payment_id: parsed.providerPaymentId,
        }
        if (action.action === "failed") {
          processingStage = "update_failed_payment_session"
          await payment.updatePaymentSession({
            id: action.data.session_id,
            data: { provider_payment_id: parsed.providerPaymentId, webhook_event_id: event.id },
            amount: action.data.amount ?? 0,
            currency_code: "brl",
            status: "error",
          })
        } else if (action.action === "canceled") {
          processingStage = "update_canceled_payment_session"
          await payment.updatePaymentSession({
            id: action.data.session_id,
            data: { provider_payment_id: parsed.providerPaymentId, webhook_event_id: event.id },
            amount: action.data.amount ?? 0,
            currency_code: "brl",
            status: "canceled",
          })
        } else if (action.action === "pending_authorization") {
          processingStage = "authorize_pending_payment_session"
          await payment.authorizePaymentSession(action.data.session_id, {
            webhook_event_id: event.id,
            provider_payment_id: parsed.providerPaymentId,
          })
        } else {
          processingStage = "authorize_payment_session"
          await payment.authorizePaymentSession(action.data.session_id, context)
        }
      }
      processingStage = "complete_webhook_event"
      await events.updatePaymentWebhookEvents?.({ id: event.id, processing_status: "completed", attempts: 1, processed_at: new Date(), last_error: null })
    } catch {
      // Persist only the bounded processing phase; exception content can carry
      // upstream metadata and must never be retained in webhook records.
      await events.updatePaymentWebhookEvents?.({ id: event.id, processing_status: "failed", attempts: 1, last_error: `payment_webhook_${processingStage}_failed` })
    }
  } catch (error) {
    const duplicate = error instanceof Error && /unique|duplicate|already exists/i.test(error.message)
    if (!duplicate) throw error
    return response.status(202).json({ accepted: true, duplicate: true })
  }
  return response.status(202).json({ accepted: true })
}
