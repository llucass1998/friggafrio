import { createHmac } from "node:crypto"
import { POST } from "./route"
import { enqueueOmieWebhook, dispatchOmieWebhook } from "../../../integrations/omie/webhook-inbox"
jest.mock("../../../integrations/omie/webhook-inbox", () => ({
  OMIE_WEBHOOK_TOPICS: ["Produto.Alterado", "PedidoVenda.Faturado"], enqueueOmieWebhook: jest.fn(), dispatchOmieWebhook: jest.fn(),
}))
const response = () => {
  const res = { status: jest.fn(), json: jest.fn() }
  res.status.mockReturnValue(res)
  return res
}
const body = { topic: "Produto.Alterado", messageId: "evt1", event: { codigo: "SKU1" } }
const env = { ...process.env }
beforeEach(() => { jest.clearAllMocks(); process.env.OMIE_WEBHOOK_SECRET = "test-secret"; jest.mocked(enqueueOmieWebhook).mockResolvedValue(true) })
afterEach(() => { process.env = { ...env } })
it("rejeita token ausente mesmo que appKey corresponda", async () => {
  const res = response()
  await POST({ body, headers: {}, scope: {} } as never, res as never)
  expect(res.status).toHaveBeenCalledWith(401)
  expect(enqueueOmieWebhook).not.toHaveBeenCalled()
})
it("confirma recebimento persistido antes do despacho pesado", async () => {
  const res = response()
  jest.mocked(dispatchOmieWebhook).mockImplementation(async () => { expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: "received" })) })
  await POST({ body, headers: { "x-omie-token": "test-secret" }, scope: { resolve: () => ({}) } } as never, res as never)
  expect(res.status).toHaveBeenCalledWith(200)
  expect(dispatchOmieWebhook).toHaveBeenCalledTimes(1)
})
it("não emite duplicado", async () => {
  jest.mocked(enqueueOmieWebhook).mockResolvedValue(false)
  const res = response()
  await POST({ body, headers: { "x-omie-token": "test-secret" }, scope: {} } as never, res as never)
  expect(res.status).toHaveBeenCalledWith(200)
  expect(dispatchOmieWebhook).not.toHaveBeenCalled()
})
it("falha fechada sem persistência", async () => {
  jest.mocked(enqueueOmieWebhook).mockRejectedValue(new Error("redis unavailable"))
  const res = response()
  await POST({ body, headers: { "x-omie-token": "test-secret" }, scope: {} } as never, res as never)
  expect(res.status).toHaveBeenCalledWith(503)
  expect(dispatchOmieWebhook).not.toHaveBeenCalled()
})
it("valida HMAC exclusivamente sobre os bytes originais", async () => {
  process.env.OMIE_APP_SECRET = "app-secret"
  const rawBody = JSON.stringify(body)
  const signature = createHmac("sha256", "app-secret").update(rawBody).digest("hex")
  const res = response()
  await POST({ body, rawBody, headers: { "x-omie-signature": signature }, scope: { resolve: () => ({}) } } as never, res as never)
  expect(res.status).toHaveBeenCalledWith(200)
})
