import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { PROMOTIONAL_BROADCAST_DRAFT_MODULE } from "../../../../modules/promotional-broadcast-draft"
import { POST } from "./route"

const response = () => {
  const value = { statusCode: 200, payload: undefined as unknown }
  return { statusCode: value.statusCode, payload: value.payload, status(code: number) { this.statusCode = code; return this }, json(payload: unknown) { this.payload = payload; return this } }
}

describe("admin promotional broadcast draft", () => {
  const originalEnv = { ...process.env }
  afterEach(() => { process.env = { ...originalEnv }; jest.restoreAllMocks() })

  it("fails closed when external audience configuration is absent", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "http://localhost:5173"
    const res = response()
    await POST({ body: { promotion_id: "promo_1", product_ids: ["p1", "p2", "p3"] }, scope: { resolve: jest.fn() } } as never, res as never)
    expect(res.statusCode).toBe(503)
  })

  it("creates only a draft with server-derived product data", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "https://friggafrio.istigestao.com.br"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    const products = [1, 2, 3].map((n) => ({
      id: `p${n}`, title: `Produto ${n}`, handle: `produto-${n}`, thumbnail: `https://cdn.example.com/${n}.jpg`,
      metadata: { promotion_id: "promo_1", region: "SP", currency: "BRL", channel: "review", eligible: true, stock: true, valid_until: "2099-01-01", normal_price: 100, promotional_price: 80 },
      variants: [{ id: `v${n}`, title: "Padrão", metadata: {}, inventory_quantity: 10 }],
    }))
    const graph = jest.fn().mockResolvedValue({ data: products })
    const drafts = {
      listPromotionalBroadcastDrafts: jest.fn().mockResolvedValue([]),
      createPromotionalBroadcastDrafts: jest.fn().mockResolvedValue({ id: "draft_1" }),
      updatePromotionalBroadcastDrafts: jest.fn(),
    }
    const fetchMock = jest.spyOn(global, "fetch").mockResolvedValue(new Response(JSON.stringify({ id: "bcast_1" }), { status: 201 }))
    const res = response()
    await POST({ body: { promotion_id: "promo_1", product_ids: ["p1", "p2", "p3"] }, scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? { graph } : key === PROMOTIONAL_BROADCAST_DRAFT_MODULE ? drafts : undefined } } as never, res as never)
    expect(res.statusCode).toBe(201)
    expect(res.payload).toEqual({ status: "draft", broadcast_id: "bcast_1", promotion_id: "promo_1" })
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(body.name).toBe("FriggaFrio - promo_1")
    expect(body.preview_text).toBe("Condições especiais por tempo limitado.")
    expect(body).not.toHaveProperty("metadata")
    expect(body).not.toHaveProperty("scheduled_at")
    expect(fetchMock.mock.calls[0][1]?.headers).toEqual(expect.objectContaining({ "Idempotency-Key": expect.stringContaining("promotion-draft-promo_1") }))
    expect(drafts.createPromotionalBroadcastDrafts).toHaveBeenCalledWith(expect.objectContaining({ promotion_id: "promo_1", idempotency_key: expect.stringContaining("promotion-draft-promo_1") }))
    expect(drafts.updatePromotionalBroadcastDrafts).toHaveBeenCalledWith({ id: "draft_1", broadcast_id: "bcast_1", status: "draft" })
  })

  it("returns the locally persisted draft without calling Resend again", async () => {
    process.env.RESEND_API_KEY = "re_test_only"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    process.env.STOREFRONT_URL = "https://friggafrio.istigestao.com.br"
    process.env.RESEND_AUDIENCE_ID = "aud_test"
    const products = [1, 2, 3].map((n) => ({
      id: `p${n}`, title: `Produto ${n}`, handle: `produto-${n}`, thumbnail: `https://cdn.example.com/${n}.jpg`,
      metadata: { promotion_id: "promo_1", region: "SP", currency: "BRL", channel: "review", eligible: true, stock: true, valid_until: "2099-01-01", normal_price: 100, promotional_price: 80 },
      variants: [{ id: `v${n}`, title: "Padrão", metadata: {}, inventory_quantity: 10 }],
    }))
    const graph = jest.fn().mockResolvedValue({ data: products })
    const drafts = { listPromotionalBroadcastDrafts: jest.fn().mockResolvedValue([{ id: "draft_1", promotion_id: "promo_1", broadcast_id: "bcast_existing" }]) }
    const fetchMock = jest.spyOn(global, "fetch")
    const res = response()
    await POST({ body: { promotion_id: "promo_1", product_ids: ["p1", "p2", "p3"] }, scope: { resolve: (key: unknown) => key === ContainerRegistrationKeys.QUERY ? { graph } : key === PROMOTIONAL_BROADCAST_DRAFT_MODULE ? drafts : undefined } } as never, res as never)
    expect(res.statusCode).toBe(200)
    expect(res.payload).toEqual({ status: "draft", broadcast_id: "bcast_existing", promotion_id: "promo_1", idempotent: true })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
