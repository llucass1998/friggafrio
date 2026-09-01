import { createHmac } from "node:crypto"
import { MercadoPagoClient } from "../lib/mercado-pago/client"
import { assertBrl, brlCentsToDecimal, brlDecimalToCents, brlDecimalToMajor, brlMajorToCents, brlMajorToDecimal } from "../lib/mercado-pago/money"
import { canTransitionMercadoPagoState, toMedusaPaymentStatus } from "../lib/mercado-pago/status"
import { parseMercadoPagoWebhook } from "../lib/mercado-pago/webhook"
import { mercadoPagoWebhookManifest, verifyMercadoPagoWebhookSignature } from "../lib/mercado-pago/webhook-signature"

describe("Mercado Pago safeguards", () => {
  it("uses integer BRL conversion only", () => {
    expect(brlCentsToDecimal(12345)).toBe("123.45")
    expect(brlDecimalToCents("123.45")).toBe(12345)
    expect(() => brlCentsToDecimal(12.5)).toThrow("integer")
    expect(() => brlDecimalToCents("12.345")).toThrow("decimal")
    expect(() => assertBrl("usd")).toThrow("BRL")
  })

  it("keeps Medusa major-unit totals aligned with Mercado Pago decimals", () => {
    expect(brlMajorToDecimal(123.45)).toBe("123.45")
    expect(brlMajorToCents(123.45)).toBe(12345)
    expect(brlDecimalToMajor("123.45")).toBe(123.45)
    expect(() => brlMajorToDecimal(Number.NaN)).toThrow("finite")
  })

  it("never treats unknown gateway states as paid", () => {
    expect(toMedusaPaymentStatus("pending")).toBe("pending_authorization")
    expect(toMedusaPaymentStatus("approved")).toBe("captured")
    expect(toMedusaPaymentStatus("processed")).toBe("captured")
    expect(toMedusaPaymentStatus("failed")).toBe("error")
    expect(toMedusaPaymentStatus("new_gateway_state")).toBe("error")
    expect(canTransitionMercadoPagoState("approved", "pending")).toBe(false)
  })

  it("requires a fresh HMAC signature before accepting a webhook", () => {
    const secret = "sandbox-webhook-secret"
    const timestamp = String(Date.now())
    const requestId = "req_sandbox_123"
    const dataId = "order_sandbox_123"
    const digest = createHmac("sha256", secret).update(mercadoPagoWebhookManifest(dataId, requestId, timestamp)).digest("hex")
    const headers = { "x-signature": `ts=${timestamp},v1=${digest}`, "x-request-id": requestId }
    expect(verifyMercadoPagoWebhookSignature({ headers, dataId, secret })).toBe(true)
    const parsed = parseMercadoPagoWebhook({ body: { action: "payment.updated", data: { id: dataId } }, rawBody: JSON.stringify({ action: "payment.updated", data: { id: dataId } }), headers, secret })
    expect(parsed?.providerPaymentId).toBe(dataId)
    expect(parseMercadoPagoWebhook({ body: { action: "payment.updated", data: { id: dataId } }, rawBody: "{}", headers: {}, secret })).toBeNull()
  })

  it("reuses idempotency keys on transient gateway retries", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>
    fetcher.mockResolvedValueOnce(new Response("{}", { status: 429, headers: { "retry-after": "0" } })).mockResolvedValueOnce(new Response(JSON.stringify({ id: "order_1", status: "pending" }), { status: 200 }))
    const client = new MercadoPagoClient({ accessToken: "sandbox-token", fetcher, random: () => 0 })
    await expect(client.createOrder({ total_amount: "1.00" }, "idem_sandbox_operation_001")).resolves.toMatchObject({ id: "order_1" })
    expect(fetcher).toHaveBeenCalledTimes(2)
    expect(fetcher.mock.calls.every((call) => (call[1]?.headers as Record<string, string>)["X-Idempotency-Key"] === "idem_sandbox_operation_001")).toBe(true)
  })
})
