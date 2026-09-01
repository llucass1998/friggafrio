import type { CardPaymentInput, InstallmentOption, PaymentFrontendAdapter, PaymentMethod, PaymentResult, PaymentSessionContext, PaymentSessionStatus, PixPaymentView, CardPaymentView } from "@/lib/payments/contracts"
import { isMercadoPagoFrontendConfigured, isPaymentBackendConfigured, isPaymentDevelopmentMockEnabled, mercadoPagoProviderId } from "@/lib/payments/runtime"
import { paymentSessionStatusOf } from "@/lib/payments/payment-session-status"
import { sdk } from "@/lib/medusa"

const unavailable = (operation: string): never => { throw new Error(`Pagamento indisponível: integração não configurada (${operation}).`) }
const failClosedAdapter: PaymentFrontendAdapter = {
  getAvailableMethods: async () => unavailable("métodos"), initializeSession: async () => unavailable("sessão"), preparePix: async () => unavailable("Pix"), prepareCard: async () => unavailable("cartão"), getInstallments: async () => unavailable("parcelas"), confirmPayment: async () => unavailable("confirmação"), getStatus: async () => unavailable("status"), cancelAttempt: async () => unavailable("cancelamento"),
}
const mockMethods: PaymentMethod[] = [{ id: "pix", label: "Pix", description: "Aprovação rápida após a confirmação do pagamento.", enabled: true }, { id: "card", label: "Cartão de crédito", description: "Use o componente seguro do Mercado Pago.", enabled: true }]
/** Safe checkout error: provider responses and sensitive request data never reach the UI. */
export class PaymentAdapterError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "PaymentAdapterError"
    this.code = code
  }
}

const mockInstallments: InstallmentOption[] = [1, 2, 3, 6, 10].map((value) => ({ value, label: `${value}x sem juros` }))
const mockAdapter: PaymentFrontendAdapter = {
  async getAvailableMethods() { return mockMethods },
  async initializeSession() { return { status: "created" as PaymentSessionStatus } },
  async preparePix(context) { return { status: "ready", amount: context.prepared.total, expiresAt: new Date(Date.now() + 1_800_000).toISOString(), copyPasteCode: "DEMO-PIX-CODE-NOT-A-REAL-CHARGE" } },
  async prepareCard() { return { status: "ready", secureMountId: "mercado-pago-secure-card-mount", holderName: "", installments: mockInstallments, selectedInstallments: 1 } },
  async getInstallments() { return mockInstallments },
  async confirmPayment(context, method, input) {
    if (method === "card" && !input?.token) return { status: "unknown", uiState: "error", error: { code: "CARD_TOKEN_REQUIRED", message: "Conclua a tokenizacao segura do cartao.", recoverable: true } }
    if (method === "pix") return { status: "pending", uiState: "pending", publicReference: "demo-pix-pending", pix: { status: "pending", amount: context.prepared.total, expiresAt: new Date(Date.now() + 1_800_000).toISOString(), copyPasteCode: "DEMO-PIX-CODE-NOT-A-REAL-CHARGE" } }
    return { status: "approved", uiState: "approved", publicReference: "demo-card-approved" }
  },
  async getStatus() { return { status: "pending", uiState: "pending", publicReference: "demo-pix-pending" } },
  async cancelAttempt() { return { status: "cancelled", uiState: "cancelled" } },
}

type PaymentSession = { id?: string; provider_id?: string; status?: string; data?: Record<string, unknown> }
type PaymentCollection = { payment_sessions?: PaymentSession[] }

const resultOf = (session: PaymentSession, method: "pix" | "card", amount: number): PaymentResult => {
  const status = paymentSessionStatusOf(session.status)
  const data = session.data || {}
  const uiState = status === "captured" || status === "authorized" ? "approved" : status === "pending" ? "pending" : status === "cancelled" ? "cancelled" : status === "rejected" ? "rejected" : "error"
  const result: PaymentResult = { status, uiState, publicReference: session.id }
  if (method === "pix") {
    const pix: PixPaymentView = {
      status: uiState,
      amount,
      ...(typeof data.expires_at === "string" ? { expiresAt: data.expires_at } : {}),
      ...(typeof data.pix_copy_paste === "string" ? { copyPasteCode: data.pix_copy_paste } : {}),
      ...(typeof data.pix_qr_code_base64 === "string" ? { qrCodeBase64: data.pix_qr_code_base64 } : {}),
    }
    result.pix = pix
  }
  return result
}

const liveSession = async (context: PaymentSessionContext, method: "pix" | "card", input?: CardPaymentInput): Promise<PaymentSession> => {
  let cart: Awaited<ReturnType<typeof sdk.store.cart.retrieve>>["cart"]
  try {
    ({ cart } = await sdk.store.cart.retrieve(context.cartId, { fields: "*payment_collection.payment_sessions,*payment_collection,*shipping_methods,*items" }))
  } catch {
    throw new PaymentAdapterError("CART_RETRIEVAL_FAILED", "Nao foi possivel validar o carrinho para pagamento. Atualize a pagina e tente novamente.")
  }
  if (!cart) throw new PaymentAdapterError("CART_NOT_FOUND", "O carrinho nao esta mais disponivel para pagamento. Atualize a pagina e tente novamente.")
  const data: Record<string, unknown> = {
    // Medusa replaces session_id with a new payment-session ID. Keep the
    // cart reference separately so the backend can make retries idempotent.
    cart_id: context.cartId,
    session_id: context.cartId,
    payment_method: method,
    payer_email: context.payer.email,
    ...(context.payer.firstName ? { payer_first_name: context.payer.firstName } : {}),
    ...(context.payer.lastName ? { payer_last_name: context.payer.lastName } : {}),
    ...(context.payer.documentType ? { payer_document_type: context.payer.documentType } : {}),
    ...(context.payer.document ? { payer_document: context.payer.document } : {}),
    ...(method === "card" && input?.token ? { card_token: input.token } : {}),
    ...(method === "card" && input?.paymentMethodId ? { card_payment_method_id: input.paymentMethodId } : {}),
    ...(method === "card" && input?.installments ? { installments: input.installments } : {}),
  }
  let payment_collection: PaymentCollection
  try {
    ({ payment_collection } = await sdk.store.payment.initiatePaymentSession(cart, { provider_id: mercadoPagoProviderId, data }) as { payment_collection: PaymentCollection })
  } catch {
    throw new PaymentAdapterError("PAYMENT_SESSION_INITIALIZATION_FAILED", "Nao foi possivel iniciar a sessao segura de pagamento. Tente novamente.")
  }
  const session = (payment_collection as PaymentCollection).payment_sessions?.find((candidate) => candidate.provider_id === mercadoPagoProviderId)
  if (!session?.id) throw new PaymentAdapterError("PAYMENT_SESSION_MISSING", "A sessao de pagamento nao foi confirmada pelo servidor. Tente novamente.")
  return session
}

const retrieveSession = async (context: PaymentSessionContext, publicReference: string): Promise<PaymentSession> => {
  const { cart } = await sdk.store.cart.retrieve(context.cartId, { fields: "*payment_collection.payment_sessions,*payment_collection" })
  const session = (cart?.payment_collection as PaymentCollection | undefined)?.payment_sessions?.find((item) => item.id === publicReference && item.provider_id === mercadoPagoProviderId)
  if (!session) throw new Error("Pagamento não encontrado")
  return session
}

// A cart is the server-authoritative owner of its payment sessions. This lets a
// refreshed checkout recover an existing attempt without accepting a client
// supplied financial reference or recreating a Mercado Pago order.
export const recoverPaymentAttemptForCart = async (cartId: string): Promise<PaymentResult | null> => {
  const { cart } = await sdk.store.cart.retrieve(cartId, { fields: "*payment_collection.payment_sessions,*payment_collection" })
  const sessions = (cart?.payment_collection as PaymentCollection | undefined)?.payment_sessions || []
  const session = sessions.find((candidate) => {
    const data = candidate.data || {}
    return candidate.provider_id === mercadoPagoProviderId &&
      typeof data.id === "string" &&
      (data.payment_method === "pix" || data.payment_method === "card")
  })
  if (!session) return null
  const method = session.data?.payment_method === "card" ? "card" : "pix"
  return resultOf(session, method, Number(cart?.total || 0))
}

const liveAdapter: PaymentFrontendAdapter = {
  async getAvailableMethods() { return [{ id: "pix", label: "Pix", description: "Pagamento via Pix do Mercado Pago.", enabled: true }, { id: "card", label: "Cartão", description: "Cartão tokenizado pelo componente oficial.", enabled: true }] },
  async initializeSession(context, method) { const session = await liveSession(context, method); return { status: paymentSessionStatusOf(session.status) } },
  async preparePix(context) { const session = await liveSession(context, "pix"); return resultOf(session, "pix", context.prepared.total).pix as PixPaymentView },
  async prepareCard(): Promise<CardPaymentView> { return { status: "ready", secureMountId: "mercado-pago-secure-card-mount", holderName: "", installments: mockInstallments, selectedInstallments: 1 } },
  async getInstallments() { return mockInstallments },
  async confirmPayment(context, method, input) {
    if (method === "card" && !input?.token) throw new Error("Conclua a tokenização segura do cartão para continuar.")
    const session = await liveSession(context, method, input)
    if (method === "pix") return resultOf(session, method, context.prepared.total)
    if (session.status === "pending") {
      const completed = await sdk.store.cart.complete(context.cartId, {})
      if (completed.type !== "order") throw new Error("O cartão ainda não foi autorizado pelo Mercado Pago.")
      return { status: "captured", uiState: "approved", publicReference: completed.order.id }
    }
    return resultOf(session, method, context.prepared.total)
  },
  async getStatus(context, publicReference) {
    const session = await retrieveSession(context, publicReference)
    return resultOf(session, "pix", context.prepared.total)
  },
  async cancelAttempt() { throw new Error("Cancelamento deve ser executado pelo backend autorizado.") },
}

export const createPaymentFrontendAdapter = (): PaymentFrontendAdapter => isPaymentDevelopmentMockEnabled ? mockAdapter : isMercadoPagoFrontendConfigured ? liveAdapter : failClosedAdapter
export const isPaymentAdapterConfigured = (): boolean => isPaymentDevelopmentMockEnabled || (isPaymentBackendConfigured && isMercadoPagoFrontendConfigured)
export const isSafeCardInput = (input: CardPaymentInput | undefined): boolean => !input || !Object.keys(input).some((key) => /pan|cvv|security.?code|card.?number/i.test(key))
export const paymentAdapterContractVersion = "checkout-payment-frontend-v1"
