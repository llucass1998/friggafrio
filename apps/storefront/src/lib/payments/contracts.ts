import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import type { HttpTypes } from "@medusajs/types"

export type PaymentMethodId = "pix" | "card"
export type PaymentMethod = { id: PaymentMethodId; label: string; description: string; enabled: boolean }
export type PaymentUiState = "idle" | "loading" | "ready" | "validating" | "processing" | "pending" | "approved" | "rejected" | "expired" | "cancelled" | "error" | "unavailable"
export type PaymentSessionStatus = "created" | "pending" | "processing" | "requires_action" | "authorized" | "approved" | "captured" | "rejected" | "cancelled" | "expired" | "partially_refunded" | "refunded" | "chargeback" | "unknown"
export type PaymentError = { code: string; message: string; recoverable: boolean }
export type PayerInformation = { email: string; firstName?: string; lastName?: string; documentType?: "CPF" | "CNPJ"; document?: string }
export type CheckoutCustomerInfo = {
  personType: "individual" | "business"
  document: string
  legalName: string
  tradeName: string
  firstName: string
  lastName: string
  email: string
  phone: string
}
export type BillingAddress = { firstName: string; lastName: string; address1: string; address2?: string; city: string; province: string; postalCode: string; countryCode: "br" }
export type InstallmentOption = { value: number; label: string }
export type PixPaymentView = { status: PaymentUiState; amount: number; expiresAt?: string; qrCode?: string; qrCodeBase64?: string; copyPasteCode?: string }
export type CardPaymentView = { status: PaymentUiState; secureMountId: string; holderName: string; document?: string; brand?: string; installments: InstallmentOption[]; selectedInstallments: number; requiresAuthentication?: boolean }
export type CheckoutReview = { cart: HttpTypes.StoreCart; prepared: CheckoutPreparedSummary; paymentMethod: PaymentMethodId; payer: PayerInformation; billingAddress?: BillingAddress }
export type PaymentResult = { status: PaymentSessionStatus; uiState: Extract<PaymentUiState, "pending" | "approved" | "rejected" | "expired" | "cancelled" | "error">; publicReference?: string; pix?: PixPaymentView; error?: PaymentError }
export type PaymentSessionContext = { cartId: string; regionId?: string; prepared: CheckoutPreparedSummary; payer: PayerInformation; billingAddress?: BillingAddress }
/** The Brick owns cardholder fields; the app receives only its temporary token and safe metadata. */
export type CardPaymentInput = { secureMountId: string; token?: string; paymentMethodId?: string; document?: string; installments: number }
export type CheckoutPaymentSelection = { method: PaymentMethodId; card?: CardPaymentInput }
export type PaymentFrontendAdapter = {
  getAvailableMethods(context: PaymentSessionContext): Promise<PaymentMethod[]>
  initializeSession(context: PaymentSessionContext, method: PaymentMethodId): Promise<{ status: PaymentSessionStatus }>
  preparePix(context: PaymentSessionContext): Promise<PixPaymentView>
  prepareCard(context: PaymentSessionContext): Promise<CardPaymentView>
  getInstallments(context: PaymentSessionContext, method: PaymentMethodId): Promise<InstallmentOption[]>
  confirmPayment(context: PaymentSessionContext, method: PaymentMethodId, input?: CardPaymentInput): Promise<PaymentResult>
  getStatus(context: PaymentSessionContext, publicReference: string): Promise<PaymentResult>
  cancelAttempt(context: PaymentSessionContext, publicReference: string): Promise<PaymentResult>
}
