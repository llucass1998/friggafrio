import { MercadoPagoProviderService, selectOrdersPayerEmail, type PaymentAttemptStore, type PaymentOperationStore } from "./index"
import { MercadoPagoClient } from "../../lib/mercado-pago/client"
import { asFunction, asValue, createContainer } from "@medusajs/framework/awilix"
import { createHmac } from "node:crypto"
import { mercadoPagoWebhookManifest } from "../../lib/mercado-pago/webhook-signature"

describe("MercadoPagoProviderService", () => {
  const cradle = (attempts: PaymentAttemptStore, operations: PaymentOperationStore) => ({
    paymentAttempt: attempts,
    paymentOperation: operations,
  })

  it("constructs through Medusa's Awilix cradle without resolving a phantom dependency", () => {
    const attempts = { listPaymentAttempts: jest.fn(), createPaymentAttempts: jest.fn(), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const container = createContainer()
    container.register({
      paymentAttempt: asValue(attempts),
      paymentOperation: asValue(operations),
      provider: asFunction((awilixCradle) => new MercadoPagoProviderService(awilixCradle, {
        accessToken: "sandbox-access-token",
        webhookSecret: "sandbox-webhook-secret",
        environment: "sandbox",
      })),
    })

    expect(() => container.resolve("provider")).not.toThrow()
  })

  it("sends Medusa major-unit totals to Mercado Pago without a cents/major mismatch", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValue([]), createPaymentAttempts: jest.fn().mockResolvedValue({ id: "attempt_1" }), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const createOrder = jest.spyOn(MercadoPagoClient.prototype, "createOrder").mockResolvedValue({ id: "order_1", status: "pending", total_amount: "123.45", currency_id: "BRL" })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      await provider.initiatePayment({ amount: 123.45, currency_code: "brl", data: { session_id: "ps_1", cart_id: "cart_1", payment_method: "pix", payer_email: "qa-payer@testuser.com" }, context: { idempotency_key: "idem_payment_123" } })
      expect(createOrder).toHaveBeenCalledWith(expect.objectContaining({ total_amount: "123.45" }), expect.stringMatching(/^[a-f0-9]{64}$/))
    } finally {
      createOrder.mockRestore()
    }
  })

  it("uses Orders API's method-specific sandbox buyer e-mail without changing the commercial customer", () => {
    const commercialCustomerEmail = "customer@example.com"
    expect(selectOrdersPayerEmail("card", commercialCustomerEmail, "sandbox")).toBe("test@testuser.com")
    expect(selectOrdersPayerEmail("pix", commercialCustomerEmail, "sandbox")).toBe("test_user_br@testuser.com")
    expect(selectOrdersPayerEmail("card", commercialCustomerEmail, "production")).toBe(commercialCustomerEmail)
  })

  it("creates an Orders API sandbox payment for a valid commercial customer e-mail", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValue([]), createPaymentAttempts: jest.fn().mockResolvedValue({ id: "attempt_customer_email" }), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const createOrder = jest.spyOn(MercadoPagoClient.prototype, "createOrder").mockResolvedValue({ id: "order_customer_email", status: "pending", total_amount: "10.00", currency_id: "BRL" })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      await provider.initiatePayment({ amount: 10, currency_code: "brl", data: { session_id: "ps_customer_email", cart_id: "cart_customer_email", payment_method: "pix", payer_email: "customer@example.com" } })
      expect((createOrder.mock.calls[0][0] as { payer: { email: string } }).payer.email).toBe("test_user_br@testuser.com")
    } finally {
      createOrder.mockRestore()
    }
  })

  it("uses the Orders API payer shape and exposes Pix data from payment_method", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValue([]), createPaymentAttempts: jest.fn().mockResolvedValue({ id: "attempt_pix" }), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const createOrder = jest.spyOn(MercadoPagoClient.prototype, "createOrder").mockResolvedValue({
      id: "order_pix",
      status: "action_required",
      total_amount: "9.80",
      currency_id: "BRL",
      transactions: { payments: [{ date_of_expiration: "2026-08-27T01:00:00.000Z", payment_method: { qr_code: "pix-copy", qr_code_base64: "pix-image" } }] },
    })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      const result = await provider.initiatePayment({ amount: 9.8, currency_code: "brl", data: { session_id: "ps_pix", cart_id: "cart_pix", payment_method: "pix", payer_email: "qa-payer@testuser.com", payer_first_name: "Checkout", payer_last_name: "Sandbox", payer_document_type: "CPF", payer_document: "12345678909" }, context: { idempotency_key: "idem_payment_pix" } })
      const payload = createOrder.mock.calls[0][0] as Record<string, unknown>
      expect(payload.payer).toEqual({ email: "test_user_br@testuser.com", first_name: "Checkout", last_name: "Sandbox", identification: { type: "CPF", number: "12345678909" } })
      expect((payload.transactions as { payments: Array<Record<string, unknown>> }).payments[0]).not.toHaveProperty("payer")
      expect(result.status).toBe("pending_authorization")
      expect(result.data).toMatchObject({ pix_copy_paste: "pix-copy", pix_qr_code_base64: "pix-image" })
    } finally {
      createOrder.mockRestore()
    }
  })

  it("places the card brand and installments inside payment_method", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValue([]), createPaymentAttempts: jest.fn().mockResolvedValue({ id: "attempt_card" }), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const createOrder = jest.spyOn(MercadoPagoClient.prototype, "createOrder").mockResolvedValue({ id: "order_card", status: "pending", total_amount: "10.00", currency_id: "BRL" })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      await provider.initiatePayment({ amount: 10, currency_code: "brl", data: { session_id: "ps_card", cart_id: "cart_card", payment_method: "card", card_token: "tok_test", card_payment_method_id: "master", installments: 3, payer_email: "qa-payer@testuser.com" } })
      const payload = createOrder.mock.calls[0][0] as { transactions: { payments: Array<{ payment_method: Record<string, unknown> }> } }
      expect(payload.transactions.payments[0].payment_method).toEqual({ id: "master", type: "credit_card", token: "tok_test", installments: 3 })
      expect((createOrder.mock.calls[0][0] as { payer: { email: string } }).payer.email).toBe("test@testuser.com")
    } finally {
      createOrder.mockRestore()
    }
  })

  it("persists a declined Order as an error payment session instead of throwing a generic 500", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValue([]), createPaymentAttempts: jest.fn().mockResolvedValue({ id: "attempt_declined" }), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const createOrder = jest.spyOn(MercadoPagoClient.prototype, "createOrder").mockResolvedValue({ id: "order_declined", status: "failed", total_amount: "10.00", currency_id: "BRL" })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      const result = await provider.initiatePayment({ amount: 10, currency_code: "brl", data: { session_id: "ps_declined", cart_id: "cart_declined", payment_method: "card", card_token: "tok_declined", card_payment_method_id: "master", installments: 1, payer_email: "qa-payer@testuser.com" } })
      expect(result.status).toBe("error")
      expect(attempts.updatePaymentAttempts).toHaveBeenCalledWith(expect.objectContaining({ provider_payment_id: "order_declined", status: "failed" }))
    } finally {
      createOrder.mockRestore()
    }
  })

  it("derives a stable idempotency key when Medusa creates the first Store API session", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: "attempt_stable", provider_payment_id: "order_stable", payment_session_id: "ps_first" }]), createPaymentAttempts: jest.fn().mockResolvedValue({ id: "attempt_stable" }), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const createOrder = jest.spyOn(MercadoPagoClient.prototype, "createOrder").mockResolvedValue({ id: "order_stable", status: "pending", total_amount: "9.80", currency_id: "BRL" })
    const getOrder = jest.spyOn(MercadoPagoClient.prototype, "getOrder").mockResolvedValue({ id: "order_stable", status: "pending", total_amount: "9.80", currency_id: "BRL" })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      const input = { amount: 9.8, currency_code: "brl", data: { session_id: "ps_first", cart_id: "cart_qa", payment_method: "pix" as const, payer_email: "qa-payer@testuser.com" } }
      await provider.initiatePayment(input)
      await provider.initiatePayment({ ...input, data: { ...input.data, session_id: "ps_recreated" } })
      const firstKey = createOrder.mock.calls[0][1]
      expect(firstKey).toMatch(/^[a-f0-9]{64}$/)
      expect(createOrder).toHaveBeenCalledTimes(1)
      expect(attempts.listPaymentAttempts.mock.calls[1][0]).toEqual(attempts.listPaymentAttempts.mock.calls[0][0])
      expect(attempts.updatePaymentAttempts).toHaveBeenLastCalledWith(expect.objectContaining({ id: "attempt_stable", cart_id: "cart_qa", payment_session_id: "ps_recreated" }))
    } finally {
      createOrder.mockRestore()
      getOrder.mockRestore()
    }
  })

  it("accepts the Orders API currency field during webhook reconciliation", async () => {
    const attempts = { listPaymentAttempts: jest.fn().mockResolvedValue([{ id: "attempt_webhook", payment_session_id: "ps_webhook" }]), createPaymentAttempts: jest.fn(), updatePaymentAttempts: jest.fn() }
    const operations = { listPaymentOperations: jest.fn(), createPaymentOperations: jest.fn(), updatePaymentOperations: jest.fn() }
    const getOrder = jest.spyOn(MercadoPagoClient.prototype, "getOrder").mockResolvedValue({ id: "order_webhook", status: "action_required", total_amount: "9.80", currency: "BRL" })
    try {
      const provider = new MercadoPagoProviderService(cradle(attempts, operations), { accessToken: "sandbox-access-token", webhookSecret: "sandbox-webhook-secret", environment: "sandbox" })
      const requestId = "request_webhook"
      const timestamp = String(Date.now())
      const signature = createHmac("sha256", "sandbox-webhook-secret").update(mercadoPagoWebhookManifest("order_webhook", requestId, timestamp)).digest("hex")
      const result = await provider.getWebhookActionAndData({ data: { data: { id: "order_webhook" } }, headers: { "x-request-id": requestId, "x-signature": `ts=${timestamp},v1=${signature}` } } as never)
      expect(result).toMatchObject({ action: "pending_authorization", data: { session_id: "ps_webhook", amount: 9.8 } })
      expect(getOrder).toHaveBeenCalledWith("order_webhook")
    } finally {
      getOrder.mockRestore()
    }
  })
})
