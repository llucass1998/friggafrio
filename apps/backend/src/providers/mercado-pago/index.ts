import { AbstractPaymentProvider, PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils"
import { createHash } from "node:crypto"
import type { AuthorizePaymentInput, AuthorizePaymentOutput, CancelPaymentInput, CancelPaymentOutput, CapturePaymentInput, CapturePaymentOutput, DeletePaymentInput, DeletePaymentOutput, GetPaymentStatusInput, GetPaymentStatusOutput, InitiatePaymentInput, InitiatePaymentOutput, ProviderWebhookPayload, RefundPaymentInput, RefundPaymentOutput, RetrievePaymentInput, RetrievePaymentOutput, UpdatePaymentInput, UpdatePaymentOutput, WebhookActionResult } from "@medusajs/framework/types"
import { MercadoPagoClient, MercadoPagoRequestError, type MercadoPagoOrder } from "../../lib/mercado-pago/client"
import { assertBrl, brlDecimalToCents, brlDecimalToMajor, brlMajorToCents, brlMajorToDecimal } from "../../lib/mercado-pago/money"
import { toMedusaPaymentStatus } from "../../lib/mercado-pago/status"
import { verifyMercadoPagoWebhookSignature } from "../../lib/mercado-pago/webhook-signature"

type MercadoPagoEnvironment = "sandbox" | "production"
type MercadoPagoProviderOptions = { accessToken: string; webhookSecret: string; environment: "sandbox"; timeoutMs?: number }
type SessionData = { id?: string; session_id?: string; cart_id?: string; payment_method?: "pix" | "card"; card_token?: string; card_payment_method_id?: string; payer_email?: string; payer_first_name?: string; payer_last_name?: string; payer_document_type?: "CPF" | "CNPJ"; payer_document?: string; installments?: number; expiration_time?: string; amount?: string }
export type PaymentAttemptStore = {
  listPaymentAttempts(filters: Record<string, unknown>): Promise<Array<{ id: string; provider_payment_id?: string | null; payment_session_id?: string | null }>>
  createPaymentAttempts(input: Record<string, unknown>): Promise<{ id: string }>
  updatePaymentAttempts(input: Record<string, unknown>): Promise<unknown>
}
export type PaymentOperationStore = {
  listPaymentOperations(filters: Record<string, unknown>): Promise<Array<{ id: string; status: string; amount?: number | string | null }>>
  createPaymentOperations(input: Record<string, unknown>): Promise<{ id: string }>
  updatePaymentOperations(input: Record<string, unknown>): Promise<unknown>
}
type MercadoPagoProviderCradle = {
  paymentAttempt: PaymentAttemptStore
  paymentOperation: PaymentOperationStore
  logger?: { error(message: string, ...meta: unknown[]): void }
}
export const selectOrdersPayerEmail = (
  method: "pix" | "card",
  customerEmail: string,
  environment: MercadoPagoEnvironment,
): string => environment === "sandbox"
  ? (method === "pix" ? "test_user_br@testuser.com" : "test@testuser.com")
  : customerEmail
const payerForOrder = (data: SessionData, environment: MercadoPagoEnvironment): Record<string, unknown> => {
  // Orders API sandbox requires method-specific test-buyer e-mails. The
  // customer's commercial identity remains untouched in Medusa and the UI.
  const email = selectOrdersPayerEmail(data.payment_method as "pix" | "card", data.payer_email ?? "", environment)
  const payerIdentification = data.payer_document_type && data.payer_document
    ? { type: data.payer_document_type, number: data.payer_document }
    : undefined
  return {
    email,
    ...(data.payer_first_name ? { first_name: data.payer_first_name } : {}),
    ...(data.payer_last_name ? { last_name: data.payer_last_name } : {}),
    ...(payerIdentification ? { identification: payerIdentification } : {}),
  }
}
const dataOf = (value: unknown): SessionData => value && typeof value === "object" ? value as SessionData : {}
const idempotencyKey = (context: unknown, data: SessionData, discriminator: readonly unknown[]): string => {
  const key = (context as { idempotency_key?: unknown } | undefined)?.idempotency_key
  if (typeof key === "string" && key.length >= 12) return key
  if (!data.session_id || !data.payment_method) throw new Error("Mercado Pago requires a stable server payment reference")
  // The Store API creates the first session without a workflow idempotency key.
  // Derive one only from server-authoritative amount/currency plus the cart reference.
  return createHash("sha256")
    .update(`mercado-pago:${data.session_id}:${data.payment_method}:${discriminator.map((part) => typeof part === "string" ? part : JSON.stringify(part)).join(":")}`)
    .digest("hex")
}
const initiationIdempotencyKey = (data: SessionData, amount: unknown, currencyCode: unknown): string => {
  if (!data.cart_id || !data.payment_method) throw new Error("Mercado Pago payment session requires a stable cart_id and payment_method")
  return createHash("sha256")
    .update(`mercado-pago:${data.cart_id}:${data.payment_method}:${String(amount)}:${String(currencyCode).toLowerCase()}`)
    .digest("hex")
}
const currencyOf = (order: MercadoPagoOrder): string | undefined => order.currency ?? order.currency_id
const orderData = (order: MercadoPagoOrder, sessionId: string): Record<string, unknown> => {
  const payment = order.transactions?.payments?.[0] as { payment_method?: { qr_code?: unknown; qr_code_base64?: unknown }; date_of_expiration?: unknown } | undefined
  return { id: order.id, session_id: sessionId, external_reference: order.external_reference, amount: order.total_amount, currency_code: currencyOf(order)?.toLowerCase(), status: order.status, pix_copy_paste: payment?.payment_method?.qr_code, pix_qr_code_base64: payment?.payment_method?.qr_code_base64, expires_at: payment?.date_of_expiration }
}
const requireOrderId = (data: SessionData): string => { if (!data.id) throw new Error("Mercado Pago order identifier is required"); return data.id }
const cardMethodIds = new Set(["amex", "elo", "diners", "hipercard", "master", "visa"])

export class MercadoPagoProviderService extends AbstractPaymentProvider<MercadoPagoProviderOptions> {
  static identifier = "mercado-pago"
  private readonly client: MercadoPagoClient
  private readonly paymentAttempts: PaymentAttemptStore
  private readonly paymentOperations: PaymentOperationStore
  private readonly logger: { error(message: string, ...meta: unknown[]): void }
  static validateOptions(options: MercadoPagoProviderOptions): void { if (!options?.accessToken || !options?.webhookSecret || options.environment !== "sandbox") throw new Error("Mercado Pago is enabled only with complete sandbox configuration") }
  constructor(container: MercadoPagoProviderCradle, options: MercadoPagoProviderOptions) {
    super(container, options); this.client = new MercadoPagoClient({ accessToken: options.accessToken, timeoutMs: options.timeoutMs })
    // Payment providers receive Awilix's cradle. Resolve dependencies by their
    // registered module keys instead of calling a nonexistent cradle.resolve.
    this.paymentAttempts = container.paymentAttempt
    this.paymentOperations = container.paymentOperation
    try {
      this.logger = container.logger ?? console
    } catch {
      // Unit containers may omit the optional logger registration.
      this.logger = console
    }
  }
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    assertBrl(input.currency_code); const data = dataOf(input.data)
    if (!data.session_id || !data.payer_email || !data.payment_method) throw new Error("Mercado Pago payment session requires session_id, payer_email, and payment_method")
    if (data.payment_method === "card" && !data.card_token) throw new Error("Mercado Pago card payments require a Brick token")
    const operationKey = initiationIdempotencyKey(data, input.amount, input.currency_code); const existing = await this.paymentAttempts.listPaymentAttempts({ idempotency_key: operationKey })
    if (existing[0]?.provider_payment_id) {
      await this.paymentAttempts.updatePaymentAttempts({ id: existing[0].id, cart_id: data.cart_id, payment_session_id: data.session_id })
      const order = await this.client.getOrder(existing[0].provider_payment_id)
      return { id: order.id, status: toMedusaPaymentStatus(order.status), data: orderData(order, data.session_id) }
    }
    const attempt = existing[0] ?? await this.paymentAttempts.createPaymentAttempts({ provider: "mercado-pago", idempotency_key: operationKey, cart_id: data.cart_id, payment_session_id: data.session_id, amount: input.amount, currency_code: input.currency_code.toLowerCase(), method: data.payment_method, status: "processing", attempt_number: 1 })
    const amount = brlMajorToDecimal(input.amount as number)
    const paymentMethod = data.payment_method === "pix" ? { id: "pix", type: "bank_transfer" } : (() => {
      if (!data.card_payment_method_id || !cardMethodIds.has(data.card_payment_method_id)) throw new Error("Mercado Pago card payments require a supported payment method id")
      return { id: data.card_payment_method_id, type: "credit_card", token: data.card_token, installments: data.installments ?? 1 }
    })()
    let order: MercadoPagoOrder
    try {
      order = await this.client.createOrder({ type: "online", processing_mode: "automatic", total_amount: amount, external_reference: data.session_id, payer: payerForOrder(data, this.config.environment), transactions: { payments: [{ amount, payment_method: paymentMethod, ...(data.payment_method === "pix" && data.expiration_time && /^P/.test(data.expiration_time) ? { expiration_time: data.expiration_time } : {}) }] } }, operationKey)
    } catch (error) {
      const details = error instanceof MercadoPagoRequestError
        ? { status: error.status, category: error.category, request_id: error.requestId }
        : { status: undefined, category: "internal_provider_error", request_id: undefined }
      this.logger.error("Mercado Pago payment initiation failed", { stage: "orders_create", ...details })
      await this.paymentAttempts.updatePaymentAttempts({
        id: attempt.id,
        status: "failed",
        failure_code: details.category,
        failure_message_sanitized: "gateway_order_creation_failed",
      })
      if (error instanceof MercadoPagoRequestError) {
        return {
          id: data.session_id,
          status: PaymentSessionStatus.ERROR,
          data: {
            session_id: data.session_id,
            status: "failed",
            failure_code: details.category,
          },
        }
      }
      throw error
    }
    const sessionStatus = toMedusaPaymentStatus(order.status)
    const attemptStatus = sessionStatus === PaymentSessionStatus.CAPTURED ? "captured" : sessionStatus === PaymentSessionStatus.ERROR ? "failed" : sessionStatus === PaymentSessionStatus.CANCELED ? "canceled" : "pending"
    await this.paymentAttempts.updatePaymentAttempts({ id: attempt.id, cart_id: data.cart_id, payment_session_id: data.session_id, provider_payment_id: order.id, status: attemptStatus })
    return { id: order.id, status: sessionStatus, data: orderData(order, data.session_id) }
  }
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> { const data = dataOf(input.data); const order = await this.client.getOrder(requireOrderId(data)); return { status: toMedusaPaymentStatus(order.status), data: orderData(order, data.session_id ?? "") } }
  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> { const data = dataOf(input.data); const order = await this.client.getOrder(requireOrderId(data)); return { status: toMedusaPaymentStatus(order.status), data: orderData(order, data.session_id ?? "") } }
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> { const data = dataOf(input.data); const key = idempotencyKey(input.context, data, ["capture", data.id]); const order = await this.runMutation("capture", requireOrderId(data), undefined, key, () => this.client.captureOrder(requireOrderId(data), key)); return { data: orderData(order, data.session_id ?? "") } }
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> { const data = dataOf(input.data); const key = idempotencyKey(input.context, data, ["cancel", data.id]); const order = await this.runMutation("cancel", requireOrderId(data), undefined, key, () => this.client.cancelOrder(requireOrderId(data), key)); return { data: orderData(order, data.session_id ?? "") } }
  async deletePayment(_input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    // Medusa replaces payment sessions when retrying. Deleting that local
    // session must not cancel a pending external Pix/Card order.
    return { data: {} }
  }
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = dataOf(input.data); const paymentId = requireOrderId(data); const amount = brlMajorToDecimal(input.amount as number); const key = idempotencyKey(input.context, data, ["refund", paymentId, input.amount]); const existing = await this.client.getOrder(paymentId); const refundedCents = brlMajorToCents(input.amount as number); const capturedCents = existing.total_amount ? brlDecimalToCents(existing.total_amount) : 0
    const previous = await this.paymentOperations.listPaymentOperations({ provider: "mercado-pago", provider_payment_id: paymentId, action: "refund", status: "succeeded" }); const refundedPreviously = previous.reduce((sum, operation) => sum + Number(operation.amount ?? 0), 0)
    if (!Number.isSafeInteger(refundedCents) || refundedCents <= 0 || refundedCents + refundedPreviously > capturedCents) throw new Error("Mercado Pago refund exceeds the captured amount")
    const transactionId = (existing.transactions?.payments?.[0] as { id?: unknown } | undefined)?.id
    if (typeof transactionId !== "string" || !transactionId) throw new Error("Mercado Pago refund requires a payment transaction identifier")
    const order = await this.runMutation("refund", paymentId, refundedCents, key, () => this.client.refundOrder(paymentId, transactionId, amount, key)); return { data: orderData(order, data.session_id ?? "") }
  }
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> { const data = dataOf(input.data); const order = await this.client.getOrder(requireOrderId(data)); return { data: orderData(order, data.session_id ?? "") } }
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> { assertBrl(input.currency_code); const data = dataOf(input.data); const amount = brlMajorToDecimal(input.amount as number); const key = idempotencyKey(input.context, data, ["update", data.id, input.amount, input.currency_code]); if (data.amount === amount) return this.getPaymentStatus(input); const order = await this.runMutation("update", requireOrderId(data), Number(input.amount), key, () => this.client.updateOrder(requireOrderId(data), { total_amount: amount }, key)); return { status: toMedusaPaymentStatus(order.status), data: orderData(order, data.session_id ?? "") } }
  async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const notification = payload.data as { data?: { id?: unknown } }; const resourceId = typeof notification.data?.id === "string" ? notification.data.id : ""
    if (!verifyMercadoPagoWebhookSignature({ headers: payload.headers as Record<string, string | string[] | undefined>, dataId: resourceId, secret: this.config.webhookSecret })) return { action: PaymentActions.NOT_SUPPORTED }
    const order = await this.client.getOrder(resourceId); const attempt = (await this.paymentAttempts.listPaymentAttempts({ provider_payment_id: resourceId }))[0]; const sessionId = attempt?.payment_session_id ?? order.external_reference; const amount = order.total_amount ? brlDecimalToCents(order.total_amount) : 0
    if (!sessionId || currencyOf(order)?.toLowerCase() !== "brl" || amount < 0) return { action: PaymentActions.NOT_SUPPORTED }
    const status = toMedusaPaymentStatus(order.status)
    const majorAmount = order.total_amount ? brlDecimalToMajor(order.total_amount) : 0
    if (status === PaymentSessionStatus.CAPTURED) return { action: PaymentActions.SUCCESSFUL, data: { session_id: sessionId, amount: majorAmount } }
    if (status === PaymentSessionStatus.AUTHORIZED) return { action: PaymentActions.AUTHORIZED, data: { session_id: sessionId, amount: majorAmount } }
    if (status === PaymentSessionStatus.PENDING_AUTHORIZATION) return { action: PaymentActions.PENDING_AUTHORIZATION, data: { session_id: sessionId, amount: majorAmount } }
    if (status === PaymentSessionStatus.CANCELED) return { action: PaymentActions.CANCELED, data: { session_id: sessionId, amount: majorAmount } }
    return { action: PaymentActions.FAILED, data: { session_id: sessionId, amount: majorAmount } }
  }
  private async runMutation(action: "capture" | "cancel" | "refund" | "update", paymentId: string, amount: number | undefined, key: string, operation: () => Promise<MercadoPagoOrder>): Promise<MercadoPagoOrder> {
    const existing = await this.paymentOperations.listPaymentOperations({ idempotency_key: key }); if (existing[0]?.status === "succeeded") return this.client.getOrder(paymentId)
    const record = existing[0] ?? await this.paymentOperations.createPaymentOperations({ provider: "mercado-pago", provider_payment_id: paymentId, action, idempotency_key: key, amount, status: "initiated" })
    try { const result = await operation(); await this.paymentOperations.updatePaymentOperations({ id: record.id, status: "succeeded" }); return result } catch (error) { await this.paymentOperations.updatePaymentOperations({ id: record.id, status: "failed", failure_message_sanitized: "gateway_operation_failed" }); throw error }
  }
}
// Medusa payment modules load custom providers from a service array.
export default { services: [MercadoPagoProviderService] }
