import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { createOrderFulfillmentWorkflow } from "@medusajs/medusa/core-flows"
import { OmieClient, loadOmieConfig } from "../../integrations/omie"
import { withPostgresAdvisoryLock, type AdvisoryLockTransactionRunner } from "../../lib/postgres-advisory-lock"
import { getResendConfigStatus, resendRequest } from "../../lib/email/resend"

export interface ProcessInvoiceInput extends Record<string, unknown> {
  codigo_pedido?: number; codigo_pedido_integracao?: string; chave_nfe?: string; numero_nfe?: string; serie_nfe?: string
}
export interface InvoiceResult { processed: boolean; reason?: string; order_id?: string; fulfillment_id?: string }

export async function processInvoice(input: ProcessInvoiceInput, container: MedusaContainer): Promise<InvoiceResult> {
  const key = String(input.chave_nfe ?? input.cChaveNfe ?? "")
  if (!/^\d{44}$/.test(key)) throw new Error("OMIE_INVALID_NFE_KEY")
  const integration = String(input.codigo_pedido_integracao ?? input.cCodIntPed ?? "")
  const orderId = integration.replace(/^FRIGGAFRIO-/, "")
  // Consultar o pedido no ERP resolve eventos que só contêm o identificador do pedido.
  const config = loadOmieConfig()
  if (!config) throw new Error("OMIE_CONFIGURATION_REQUIRED")
  const client = new OmieClient(config)
  let targetId = orderId
  if (!targetId) {
    const code = input.codigo_pedido ?? input.nCodPed
    if (!code) throw new Error("OMIE_ORDER_IDENTIFIER_REQUIRED")
    const response = await client.request<{ cabecalho?: { codigo_pedido_integracao?: string } }>("ConsultarPedido", { codigo_pedido: code })
    targetId = (response.cabecalho?.codigo_pedido_integracao ?? "").replace(/^FRIGGAFRIO-/, "")
  }
  if (!targetId.startsWith("order_")) throw new Error("OMIE_ORDER_MAPPING_REQUIRED")
  const db = container.resolve<{ transaction: AdvisoryLockTransactionRunner }>(ContainerRegistrationKeys.PG_CONNECTION)
  return withPostgresAdvisoryLock((work) => db.transaction(work), `omie:invoice:${targetId}`, async () => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "order", filters: { id: targetId }, fields: [
      "id", "status", "email", "metadata", "items.*", "fulfillments.id", "fulfillments.metadata", "fulfillments.canceled_at",
    ] })
    const order = data[0]
    if (!order) throw new Error("OMIE_ORDER_NOT_FOUND")
    if (order.status === "canceled") throw new Error("OMIE_ORDER_CANCELED")
    if (order.metadata?.nfe_chave && order.metadata.nfe_chave !== key) throw new Error("OMIE_INVOICE_CONFLICT")
    const response = await client.request<Record<string, unknown>>("GetUrlDanfe", { cChaveNfe: key })
    const danfeUrl = String(response.cUrlDanfe ?? response.danfe_url ?? "")
    const url = new URL(danfeUrl)
    // Não buscar nem anexar conteúdo de URLs arbitrárias recebidas por webhook.
    if (url.protocol !== "https:" || url.username || url.password) throw new Error("OMIE_INVALID_DANFE_URL")
    const number = String(input.numero_nfe ?? input.cNumeroNfe ?? key.slice(25, 34))
    const series = String(input.serie_nfe ?? input.cSerieNfe ?? key.slice(22, 25))
    const metadata = { nfe_chave: key, nfe_numero: number, nfe_serie: series, danfe_url: danfeUrl }
    const fulfillments = (order.fulfillments ?? []).filter((f): f is NonNullable<typeof f> => Boolean(f))
    const existing = fulfillments.find((fulfillment) => !fulfillment.canceled_at && fulfillment.metadata?.nfe_chave === key)
    let fulfillmentId = existing?.id
    if (!fulfillmentId) {
      if (fulfillments.some((fulfillment) => !fulfillment.canceled_at)) throw new Error("OMIE_PARTIAL_FULFILLMENT_REQUIRES_REVIEW")
      const items = (order.items ?? []).filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => ({ id: item.id, quantity: Number(item.quantity) }))
      if (!items.length) throw new Error("OMIE_INVOICE_ITEMS_REQUIRED")
      const { result } = await createOrderFulfillmentWorkflow(container).run({ input: {
        order_id: order.id, items, metadata, no_notification: true,
      } })
      fulfillmentId = result.id
    }
    const orders = container.resolve(Modules.ORDER)
    if (!order.metadata?.omie_invoice_email_sent) {
      const emailConfig = getResendConfigStatus()
      if (emailConfig.missing.length || !order.email) throw new Error("OMIE_INVOICE_EMAIL_NOT_CONFIGURED")
      const tracking = typeof input.tracking_url === "string" && input.tracking_url.startsWith("https://") ? input.tracking_url : ""
      const sent = await resendRequest("/emails", { from: emailConfig.from, to: [order.email],
        subject: `Nota fiscal ${number} — FriggaFrio`,
        text: `Seu pedido foi faturado. NF-e ${number}, série ${series}.\nDANFE: ${danfeUrl}${tracking ? `\nRastreamento: ${tracking}` : ""}`,
      }, `omie-invoice-${key}`)
      if (!sent.ok || !sent.id) throw new Error("OMIE_INVOICE_EMAIL_FAILED")
    }
    await orders.updateOrders([{ id: order.id, metadata: { ...order.metadata, ...metadata, omie_fulfillment_id: fulfillmentId, omie_invoice_email_sent: true } }])
    return { processed: true, order_id: order.id, fulfillment_id: fulfillmentId }
  })
}

export const processOmieInvoiceStep = createStep("process-omie-invoice",
  async (input: ProcessInvoiceInput, { container }): Promise<StepResponse<InvoiceResult>> => new StepResponse(await processInvoice(input, container)))
export const processOmieInvoiceWorkflow = createWorkflow("process-omie-invoice", (input: ProcessInvoiceInput) => new WorkflowResponse(processOmieInvoiceStep(input)))
