import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { CheckoutStepKey } from "../../src/lib/types/global"
import { canEnterCheckoutStep, checkoutFlowReducer, initialCheckoutFlowState } from "../../src/lib/payments/checkout-flow"
import { paymentSessionStatusOf } from "../../src/lib/payments/payment-session-status"
import { classifyMercadoPagoBrickError } from "../../src/lib/payments/mercado-pago-sdk"

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8")

test("checkout flow blocks skip-ahead and invalidates later payment state", () => {
  const empty = { addressConfirmed: false, deliveryConfirmed: false, prepared: false, paymentMethod: null as null }
  assert.equal(canEnterCheckoutStep(empty, CheckoutStepKey.DELIVERY), false)
  assert.equal(canEnterCheckoutStep({ ...empty, addressConfirmed: true }, CheckoutStepKey.DELIVERY), true)
  const selected = checkoutFlowReducer(initialCheckoutFlowState, { type: "PAYMENT_SELECTED", method: "card" })
  const processing = checkoutFlowReducer(selected, { type: "PAYMENT_SUBMITTING", method: "card" })
  const reset = checkoutFlowReducer(processing, { type: "RESET_AFTER_DELIVERY_CHANGE" })
  assert.equal(reset.paymentMethod, null)
  assert.equal(reset.activeAttempt, false)
})

test("payment state machine has explicit checkout states", () => {
  const selected = checkoutFlowReducer(initialCheckoutFlowState, { type: "PAYMENT_SELECTED", method: "pix" })
  const submitting = checkoutFlowReducer(selected, { type: "PAYMENT_SUBMITTING", method: "pix" })
  const pending = checkoutFlowReducer(submitting, { type: "PAYMENT_RESULT", result: { status: "pending", uiState: "pending" } })
  const approved = checkoutFlowReducer(pending, { type: "PAYMENT_RESULT", result: { status: "captured", uiState: "approved" } })
  const stalePending = checkoutFlowReducer(approved, { type: "PAYMENT_RESULT", result: { status: "pending", uiState: "pending" } })
  assert.equal(selected.paymentState, "METHOD_SELECTED")
  assert.equal(submitting.paymentState, "SUBMITTING")
  assert.equal(pending.paymentState, "PIX_PENDING")
  assert.equal(approved.paymentState, "APPROVED")
  assert.equal(stalePending.paymentState, "APPROVED")
})

test("payment UI reserves a secure mount and has no app-owned PAN/CVV fields", () => {
  const source = read("../../src/components/checkout-payment-step.tsx")
  assert.match(source, /mercado-pago-secure-card-mount/)
  assert.match(source, /mountMercadoPagoCardBrick/)
  assert.match(source, /brickMountQueueRef/)
  assert.match(source, /await brickMountQueueRef\.current/)
  assert.match(source, /unmount\?\./)
  assert.match(source, /brickReady/)
  assert.match(source, /!selection\.card\?\.token/)
  assert.match(source, /disabled=\{!selection \|\| \(selection\.method === "card" && \(!brickReady \|\| !selection\.card\?\.token\)\)\}/)
  assert.match(source, /data-testid="checkout-payment-next"/)
  assert.match(source, /tokenizacao no formulario seguro/)
  assert.match(source, /A tentativa so sera criada apos a confirmacao explicita/)
  assert.doesNotMatch(source, /card-holder-name/)
  assert.doesNotMatch(source, /name=["'][^"']*(pan|cvv|card.?number|security.?code)/i)
  assert.doesNotMatch(source, /MERCADO_PAGO_ACCESS_TOKEN|MERCADO_PAGO_WEBHOOK_SECRET/)
})

test("disabled primary buttons do not inherit a white hover background", () => {
  const source = read("../../src/components/ui/button.tsx")
  assert.match(source, /disabled:pointer-events-none/)
  assert.doesNotMatch(source, /disabled:hover:bg-inherit/)
})

test("review confirms through the existing adapter and blocks duplicate submissions", () => {
  const source = read("../../src/components/checkout-review-step.tsx")
  assert.match(source, /createPaymentFrontendAdapter/)
  assert.match(source, /adapter\.confirmPayment/)
  assert.match(source, /if \(submitting \|\| !consent\) return/)
  assert.match(source, /Confirmar e pagar/)
  assert.doesNotMatch(source, /Pagamento disponivel apos homologacao/)
})

test("checkout uses server totals and an explicit consent control", () => {
  const source = read("../../src/components/checkout-review-step.tsx")
  assert.match(source, /prepared\.total/)
  assert.match(source, /required/)
})

test("prepared checkout can advance into the payment step", () => {
  const source = read("../../src/components/checkout-preparation-step.tsx")
  assert.match(source, /onClick=\{onNext\}/)
  assert.doesNotMatch(source, /Continuar para pagamento \(em breve\)/)
  assert.doesNotMatch(source, /disabled aria-disabled=\"true\"/)
})

test("maps the Mercado Pago Orders API action-required state to a pending Pix UI", () => {
  assert.equal(paymentSessionStatusOf("pending_authorization"), "pending")
})

test("live payment sessions carry a stable cart reference for gateway reconciliation", () => {
  const source = read("../../src/lib/payments/adapter.ts")
  assert.match(source, /session_id:\s*context\.cartId/)
  assert.match(source, /candidate\.provider_id === mercadoPagoProviderId/)
  assert.match(source, /recoverPaymentAttemptForCart/)
  assert.match(source, /candidate\.provider_id === mercadoPagoProviderId/)
  assert.match(source, /typeof data\.id === "string"/)
  assert.doesNotMatch(source, /sessionStorage/)
})

test("checkout refresh recovers only a backend-owned attempt and never a client reference", () => {
  const source = read("../../src/pages/checkout.tsx")
  assert.match(source, /recoverPaymentAttemptForCart\(cart\.id\)/)
  assert.match(source, /setRecoveredPayment\(result\)/)
  assert.doesNotMatch(source, /recoverPaymentAttemptForCart\([^)]*publicReference/)
})

test("card token is cleared after an attempt and cannot become checkout runtime state", () => {
  const source = read("../../src/pages/checkout.tsx")
  assert.match(source, /A Brick token is single-use/)
  assert.match(source, /secureMountId: "mercado-pago-secure-card-mount"/)
  assert.doesNotMatch(source, /card_token/)
})

test("live Mercado Pago card flow loads only the public SDK and never private credentials", () => {
  const source = read("../../src/lib/payments/mercado-pago-sdk.ts")
  assert.match(source, /sdk\.mercadopago\.com\/js\/v2/)
  assert.doesNotMatch(source, /ACCESS_TOKEN|WEBHOOK_SECRET|MERCADO_PAGO_ACCESS_TOKEN|MERCADO_PAGO_WEBHOOK_SECRET/)
  assert.match(source, /cardPayment/)
})

test("Card Brick failures are classified without exposing SDK payloads", () => {
  assert.equal(classifyMercadoPagoBrickError(new Error("provider payload")), "BRICK_CREATE_REJECTED")
  assert.equal(classifyMercadoPagoBrickError({ code: "SDK_CALLBACK_ERROR", message: "sensitive" }), "SDK_CALLBACK_ERROR")
})
