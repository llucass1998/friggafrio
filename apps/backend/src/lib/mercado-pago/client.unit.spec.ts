import { MercadoPagoClient, MercadoPagoRequestError } from "./client"

const jsonResponse = (body: Record<string, unknown>) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "content-type": "application/json" },
})

describe("MercadoPagoClient order mutations", () => {
  it("preserves only sanitized gateway diagnostics for a failed request", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({ message: "invalid payer", error: "invalid_request", access_token: "must-not-leak" }), { status: 400, headers: { "x-request-id": "req_sandbox" } }))
    const client = new MercadoPagoClient({ accessToken: "secret", fetcher })

    let failure: unknown
    try {
      await client.createOrder({}, "idem_sandbox_123")
    } catch (error) {
      failure = error
    }
    expect(failure).toBeInstanceOf(MercadoPagoRequestError)
    expect(failure).toMatchObject({ status: 400, category: "invalid_request", requestId: "req_sandbox" })
  })

  it("extracts the first validation category from the Orders API errors array", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: [{ code: "unsupported_properties", message: "payment payload detail" }],
    }), { status: 400 }))
    const client = new MercadoPagoClient({ accessToken: "secret", fetcher })

    await expect(client.createOrder({}, "idem_sandbox_errors")).rejects.toMatchObject({
      status: 400,
      category: "unsupported_properties",
    })
  })

  it("returns the structured declined Order instead of hiding it behind a generic error", async () => {
    const fetcher = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      errors: [{ code: "failed", message: "transaction failed" }],
      data: { id: "order_declined", status: "failed", total_amount: "9.80", currency_id: "BRL" },
    }), { status: 402 }))
    const client = new MercadoPagoClient({ accessToken: "secret", fetcher })

    await expect(client.createOrder({}, "idem_sandbox_declined")).resolves.toMatchObject({ id: "order_declined", status: "failed" })
  })

  it("uses the official Orders API mutation endpoints", async () => {
    const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>
    fetcher
      .mockResolvedValueOnce(jsonResponse({ id: "ord_cancel", status: "cancelled" }))
      .mockResolvedValueOnce(jsonResponse({ id: "ord_capture", status: "captured" }))
      .mockResolvedValueOnce(jsonResponse({ id: "ord_refund", status: "refunded" }))
    const client = new MercadoPagoClient({ accessToken: "unit-token", baseUrl: "https://sandbox.example", fetcher })

    await client.cancelOrder("ord_cancel", "cancel-key")
    await client.captureOrder("ord_capture", "capture-key")
    await client.refundOrder("ord_refund", "txn_1", "12.34", "refund-key")

    expect(fetcher.mock.calls[0][0]).toBe("https://sandbox.example/v1/orders/ord_cancel/cancel")
    expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "POST", headers: expect.objectContaining({ "X-Idempotency-Key": "cancel-key" }) })
    expect(fetcher.mock.calls[1][0]).toBe("https://sandbox.example/v1/orders/ord_capture/capture")
    expect(fetcher.mock.calls[2][0]).toBe("https://sandbox.example/v1/orders/ord_refund/refund")
    expect(fetcher.mock.calls[2][1]).toMatchObject({
      method: "POST",
      body: JSON.stringify({ transactions: [{ id: "txn_1", amount: "12.34" }] }),
      headers: expect.objectContaining({ "X-Idempotency-Key": "refund-key" }),
    })
  })
})
