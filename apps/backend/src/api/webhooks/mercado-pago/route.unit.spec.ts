import { createHmac } from "node:crypto"
import { POST } from "./route"
import { mercadoPagoWebhookManifest } from "../../../lib/mercado-pago/webhook-signature"
import { PAYMENT_WEBHOOK_EVENT_MODULE } from "../../../modules/payment-webhook-event"
import { MERCADO_PAGO_PROVIDER_ID } from "../../../lib/payment-provider-bootstrap"

const makeResponse = () => {
  const result: { statusCode?: number; body?: unknown; status: jest.Mock; json: jest.Mock } = {
    status: jest.fn((code: number) => { result.statusCode = code; return result }),
    json: jest.fn((body: unknown) => { result.body = body; return result }),
  }
  return result
}

describe("Mercado Pago webhook route", () => {
  const previousSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET
  const previousPaymentsEnabled = process.env.PAYMENTS_ENABLED
  const previousProviderEnabled = process.env.PAYMENT_PROVIDER_ENABLED
  const previousEnvironment = process.env.MERCADO_PAGO_ENV
  const previousAccessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
  beforeEach(() => {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = "unit-webhook-secret"
    process.env.PAYMENTS_ENABLED = "true"
    process.env.PAYMENT_PROVIDER_ENABLED = "true"
    process.env.MERCADO_PAGO_ENV = "sandbox"
    process.env.MERCADO_PAGO_ACCESS_TOKEN = "unit-access-token"
  })
  afterAll(() => {
    if (previousSecret === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET; else process.env.MERCADO_PAGO_WEBHOOK_SECRET = previousSecret
    if (previousPaymentsEnabled === undefined) delete process.env.PAYMENTS_ENABLED; else process.env.PAYMENTS_ENABLED = previousPaymentsEnabled
    if (previousProviderEnabled === undefined) delete process.env.PAYMENT_PROVIDER_ENABLED; else process.env.PAYMENT_PROVIDER_ENABLED = previousProviderEnabled
    if (previousEnvironment === undefined) delete process.env.MERCADO_PAGO_ENV; else process.env.MERCADO_PAGO_ENV = previousEnvironment
    if (previousAccessToken === undefined) delete process.env.MERCADO_PAGO_ACCESS_TOKEN; else process.env.MERCADO_PAGO_ACCESS_TOKEN = previousAccessToken
  })

  it("rejects unsigned notifications", async () => {
    const res = makeResponse()
    await POST({ body: { action: "payment.updated", data: { id: "pay_1" } }, headers: {}, scope: { resolve: jest.fn() } } as never, res as never)
    expect(res.statusCode).toBe(401)
  })

  it("deduplicates a signed notification before creating a second event", async () => {
    const dataId = "pay_1"
    const requestId = "req_1"
    const timestamp = String(Date.now())
    const signature = createHmac("sha256", "unit-webhook-secret").update(mercadoPagoWebhookManifest(dataId, requestId, timestamp)).digest("hex")
    const eventService = { listPaymentWebhookEvents: jest.fn().mockResolvedValue([{ id: "event_1" }]), createPaymentWebhookEvents: jest.fn() }
    const res = makeResponse()
    await POST({ body: { action: "payment.updated", data: { id: dataId } }, headers: { "x-signature": `ts=${timestamp},v1=${signature}`, "x-request-id": requestId }, scope: { resolve: (key: string) => key === PAYMENT_WEBHOOK_EVENT_MODULE ? eventService : undefined } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(res.body).toEqual({ accepted: true, duplicate: true })
    expect(eventService.createPaymentWebhookEvents).not.toHaveBeenCalled()
  })

  it("treats a unique-index race as an idempotent duplicate", async () => {
    const dataId = "pay_race"
    const requestId = "req_race"
    const timestamp = String(Date.now())
    const signature = createHmac("sha256", "unit-webhook-secret").update(mercadoPagoWebhookManifest(dataId, requestId, timestamp)).digest("hex")
    const eventService = {
      listPaymentWebhookEvents: jest.fn().mockResolvedValue([]),
      createPaymentWebhookEvents: jest.fn().mockRejectedValue(new Error("duplicate key value violates unique constraint")),
    }
    const res = makeResponse()
    await POST({ body: { action: "payment.updated", data: { id: dataId } }, headers: { "x-signature": `ts=${timestamp},v1=${signature}`, "x-request-id": requestId }, scope: { resolve: (key: string) => key === PAYMENT_WEBHOOK_EVENT_MODULE ? eventService : undefined } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(res.body).toEqual({ accepted: true, duplicate: true })
  })

  it("reconciles a newly accepted event through the payment module", async () => {
    const dataId = "pay_reconcile"
    const requestId = "req_reconcile"
    const timestamp = String(Date.now())
    const signature = createHmac("sha256", "unit-webhook-secret").update(mercadoPagoWebhookManifest(dataId, requestId, timestamp)).digest("hex")
    const eventService = {
      listPaymentWebhookEvents: jest.fn().mockResolvedValue([]),
      createPaymentWebhookEvents: jest.fn().mockResolvedValue({ id: "event_reconcile" }),
      updatePaymentWebhookEvents: jest.fn().mockResolvedValue({}),
    }
    const payment = {
      getWebhookActionAndData: jest.fn().mockResolvedValue({ action: "authorized", data: { session_id: "ps_reconcile", amount: 1000 } }),
      authorizePaymentSession: jest.fn().mockResolvedValue({ id: "payment_reconcile" }),
      updatePaymentSession: jest.fn(),
    }
    const res = makeResponse()
    await POST({ body: { action: "payment.updated", data: { id: dataId } }, headers: { "x-signature": `ts=${timestamp},v1=${signature}`, "x-request-id": requestId }, scope: { resolve: (key: string) => key === PAYMENT_WEBHOOK_EVENT_MODULE ? eventService : payment } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(payment.getWebhookActionAndData).toHaveBeenCalledWith(expect.objectContaining({ provider: MERCADO_PAGO_PROVIDER_ID.replace(/^pp_/, "") }))
    expect(payment.authorizePaymentSession).toHaveBeenCalledWith("ps_reconcile", expect.objectContaining({ webhook_event_id: "event_reconcile", provider_payment_id: dataId }))
    expect(eventService.updatePaymentWebhookEvents).toHaveBeenCalledWith(expect.objectContaining({ id: "event_reconcile", processing_status: "completed" }))
  })

  it("moves failed notifications to an error payment session without authorizing it", async () => {
    const dataId = "pay_failed"
    const requestId = "req_failed"
    const timestamp = String(Date.now())
    const signature = createHmac("sha256", "unit-webhook-secret").update(mercadoPagoWebhookManifest(dataId, requestId, timestamp)).digest("hex")
    const eventService = {
      listPaymentWebhookEvents: jest.fn().mockResolvedValue([]),
      createPaymentWebhookEvents: jest.fn().mockResolvedValue({ id: "event_failed" }),
      updatePaymentWebhookEvents: jest.fn().mockResolvedValue({}),
    }
    const payment = {
      getWebhookActionAndData: jest.fn().mockResolvedValue({ action: "failed", data: { session_id: "ps_failed", amount: 1000 } }),
      authorizePaymentSession: jest.fn(),
      updatePaymentSession: jest.fn().mockResolvedValue({ id: "ps_failed" }),
    }
    const res = makeResponse()
    await POST({ body: { action: "payment.updated", data: { id: dataId } }, headers: { "x-signature": `ts=${timestamp},v1=${signature}`, "x-request-id": requestId }, scope: { resolve: (key: string) => key === PAYMENT_WEBHOOK_EVENT_MODULE ? eventService : payment } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(payment.authorizePaymentSession).not.toHaveBeenCalled()
    expect(payment.updatePaymentSession).toHaveBeenCalledWith(expect.objectContaining({ id: "ps_failed", status: "error", currency_code: "brl" }))
  })

  it("persists pending Pix notifications through Medusa's authorization path", async () => {
    const dataId = "pay_pending"
    const requestId = "req_pending"
    const timestamp = String(Date.now())
    const signature = createHmac("sha256", "unit-webhook-secret").update(mercadoPagoWebhookManifest(dataId, requestId, timestamp)).digest("hex")
    const eventService = {
      listPaymentWebhookEvents: jest.fn().mockResolvedValue([]),
      createPaymentWebhookEvents: jest.fn().mockResolvedValue({ id: "event_pending" }),
      updatePaymentWebhookEvents: jest.fn().mockResolvedValue({}),
    }
    const payment = {
      getWebhookActionAndData: jest.fn().mockResolvedValue({ action: "pending_authorization", data: { session_id: "ps_pending", amount: 980 } }),
      authorizePaymentSession: jest.fn().mockResolvedValue(null),
      updatePaymentSession: jest.fn(),
    }
    const res = makeResponse()
    await POST({ body: { action: "payment.updated", data: { id: dataId } }, headers: { "x-signature": `ts=${timestamp},v1=${signature}`, "x-request-id": requestId }, scope: { resolve: (key: string) => key === PAYMENT_WEBHOOK_EVENT_MODULE ? eventService : payment } } as never, res as never)
    expect(res.statusCode).toBe(202)
    expect(payment.authorizePaymentSession).toHaveBeenCalledWith("ps_pending", expect.objectContaining({ webhook_event_id: "event_pending", provider_payment_id: dataId }))
    expect(payment.updatePaymentSession).not.toHaveBeenCalled()
  })
})
