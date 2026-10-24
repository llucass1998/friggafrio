import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { processOmieInvoiceWorkflow, syncOmieCatalogWorkflow, syncOmieInventoryWorkflow } from "../workflows/omie"
import { completeOmieWebhook, OMIE_WEBHOOK_TOPICS, type OmieWebhookMessage } from "../integrations/omie/webhook-inbox"

export default async function omieWebhookHandler({ event: { data }, container }: SubscriberArgs<OmieWebhookMessage>) {
  const { topic, event, eventId } = data
  if (topic === "PedidoVenda.Faturado") {
    await processOmieInvoiceWorkflow(container).run({ input: event })
  } else {
    const sku = typeof event.cCodigo === "string" ? event.cCodigo : typeof event.codigo === "string" ? event.codigo : undefined
    const externalId = event.nCodProd ?? event.codigo_produto
    if (!sku && !externalId) throw new Error("OMIE_EVENT_PRODUCT_IDENTIFIER_REQUIRED")
    const input = { sku, externalId: externalId ? String(externalId) : undefined }
    if (topic === "MovimentoEstoque.Incluido") await syncOmieInventoryWorkflow(container).run({ input })
    else await syncOmieCatalogWorkflow(container).run({ input: { ...input, deleted: topic === "Produto.Excluido" } })
  }
  await completeOmieWebhook(eventId)
}
export const config: SubscriberConfig = { event: [...OMIE_WEBHOOK_TOPICS.map((topic) => `omie.webhook.${topic}`)] }
