import handler from "./omie-webhook"
import { syncOmieCatalogWorkflow } from "../workflows/omie"
import { completeOmieWebhook } from "../integrations/omie/webhook-inbox"
const run = jest.fn()
jest.mock("../workflows/omie", () => ({ syncOmieCatalogWorkflow: jest.fn(() => ({ run })), syncOmieInventoryWorkflow: jest.fn(), processOmieInvoiceWorkflow: jest.fn() }))
jest.mock("../integrations/omie/webhook-inbox", () => ({ OMIE_WEBHOOK_TOPICS: ["Produto.Alterado"], completeOmieWebhook: jest.fn() }))
afterEach(() => jest.clearAllMocks())
it("processa evento com identificador filtrado e só então conclui entrada", async () => {
  run.mockResolvedValue({})
  await handler({ event: { name: "omie.webhook.Produto.Alterado", data: { topic: "Produto.Alterado", event: { codigo: "SKU1" }, eventId: "event1" } }, container: {} as never, pluginOptions: {} })
  expect(syncOmieCatalogWorkflow).toHaveBeenCalled()
  expect(run).toHaveBeenCalledWith({ input: { sku: "SKU1", externalId: undefined, deleted: false } })
  expect(completeOmieWebhook).toHaveBeenCalledWith("event1")
})
it("propaga falha para retry e preserva caixa de entrada", async () => {
  run.mockRejectedValue(new Error("retry"))
  await expect(handler({ event: { name: "omie.webhook.Produto.Alterado", data: { topic: "Produto.Alterado", event: { codigo: "SKU1" }, eventId: "event1" } }, container: {} as never, pluginOptions: {} })).rejects.toThrow("retry")
  expect(completeOmieWebhook).not.toHaveBeenCalled()
})
