import { createStep, StepResponse, createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"
import { OmieClient, loadOmieConfig, mapCustomerToOmieUpsert, mapOrderToOmieOrder } from "../../integrations/omie"
import type { FiscalOrderInput } from "../../integrations/omie/fiscal-types"
import { validateFiscalOrder } from "../../integrations/omie/fiscal-validation"
import { decrypt } from "../../lib/encryption"
import { withPostgresAdvisoryLock, type AdvisoryLockTransactionRunner } from "../../lib/postgres-advisory-lock"
import { fiscalIntegrationCode } from "../../integrations/omie/fiscal-idempotency"

export interface ExportOrderInput { orderId: string }
export interface ExportOrderResult { exported: boolean; reason?: string; codigo_pedido?: string; numero_pedido?: string }

// A projeção usa somente os campos fiscais persistidos; dados ausentes bloqueiam a exportação.
export async function exportOrder(input: ExportOrderInput, container: MedusaContainer): Promise<ExportOrderResult> {
  const config = loadOmieConfig()
  if (!config?.writesEnabled) return { exported: false, reason: config ? "writes_disabled" : "missing_credentials" }
  const stage = process.env.OMIE_DEFAULT_SALES_STAGE
  const taxScenario = Number(process.env.OMIE_DEFAULT_TAX_SCENARIO)
  const bank = Number(process.env.OMIE_DEFAULT_BANK_ACCOUNT)
  const category = process.env.OMIE_DEFAULT_FINANCIAL_CATEGORY
  if (!stage || !Number.isSafeInteger(taxScenario) || taxScenario <= 0 || !Number.isSafeInteger(bank) || bank <= 0 || !category) {
    return { exported: false, reason: "missing_fiscal_configuration" }
  }
  const db = container.resolve<{ transaction: AdvisoryLockTransactionRunner }>(ContainerRegistrationKeys.PG_CONNECTION)
  return withPostgresAdvisoryLock((work) => db.transaction(work), `omie:export:${input.orderId}`, async () => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "order", filters: { id: input.orderId }, fields: [
      "id", "total", "subtotal", "shipping_total", "currency_code", "status", "metadata", "email",
      "customer.id", "customer.first_name", "customer.last_name", "customer.phone", "customer.metadata",
      "shipping_address.*", "items.*", "items.variant.product.metadata", "items.variant.metadata",
      "shipping_methods.*", "payment_collections.*", "payment_collections.payments.*",
    ] })
    const order = data[0]
    if (!order) return { exported: false, reason: "order_not_found" }
    if (order.status === "canceled") return { exported: false, reason: "order_canceled" }
    if (order.metadata?.omie_codigo_pedido) return { exported: true, codigo_pedido: String(order.metadata.omie_codigo_pedido) }
    const customerId = order.customer?.id
    if (!customerId) return { exported: false, reason: "customer_missing" }
    const profiles = container.resolve<{ listCustomerProfiles(filters: { customer_id: string }): Promise<Array<{
      document_type: string; document_ciphertext: string | null; document_iv: string | null; document_auth_tag: string | null;
      corporate_name: string | null; state_inscription: string | null; is_state_inscription_exempt: boolean;
    }>> }>("customerProfile")
    const profile = (await profiles.listCustomerProfiles({ customer_id: customerId }))[0]
    if (!profile?.document_ciphertext || !profile.document_iv || !profile.document_auth_tag) return { exported: false, reason: "fiscal_document_missing" }
    const address = order.shipping_address
    const customerMeta = order.customer?.metadata ?? {}
    const addressMeta = address?.metadata ?? {}
    const document = decrypt(profile.document_ciphertext, profile.document_iv, profile.document_auth_tag)
    const payments = order.payment_collections?.flatMap((collection) => collection?.payments?.filter(Boolean) ?? []) ?? []
    const paid = payments.filter((payment) => Boolean(payment && payment.captured_at && !payment.canceled_at))
    if (!paid.length || order.payment_collections?.some((collection) => collection && collection.status !== "completed")) return { exported: false, reason: "payment_not_captured" }
    const paymentData = paid[0]?.data ?? {}
    const method = paymentData.payment_method_id === "pix" ? "pix"
      : ["credit_card", "debit_card"].includes(String(paymentData.payment_type_id)) ? "card" : null
    const installments = method === "pix" ? 1 : Number(paymentData.installments)
    if (!method || !Number.isSafeInteger(installments)) return { exported: false, reason: "payment_mapping_missing" }
    const shipping = order.shipping_methods?.[0]
    const fiscal: FiscalOrderInput = {
      medusa_order_id: order.id,
      customer: {
        external_id: customerId, name: profile.corporate_name || `${order.customer?.first_name ?? ""} ${order.customer?.last_name ?? ""}`.trim(),
        document: { type: profile.document_type === "cnpj" ? "CNPJ" : "CPF", number: document },
        email: order.email, phone: order.customer?.phone,
        consumer_final: customerMeta.consumer_final === true || profile.document_type === "cpf",
        state_registration: profile.is_state_inscription_exempt ? "ISENTO" : profile.state_inscription,
        address: { address_1: address?.address_1 ?? "", city: address?.city ?? "", state: address?.province ?? "",
          postal_code: address?.postal_code ?? "", country_code: address?.country_code ?? "",
          number: String(addressMeta.number ?? ""), neighborhood: String(addressMeta.neighborhood ?? ""), ibge_code: String(addressMeta.ibge_code ?? "") },
      },
      items: (order.items ?? []).filter((item): item is NonNullable<typeof item> => Boolean(item)).map((item) => {
        const metadata = { ...(item.variant?.product?.metadata ?? {}), ...(item.variant?.metadata ?? {}) }
        return { sku: item.variant_sku ?? "", quantity: Number(item.quantity), unit_price: Number(item.unit_price), discount: Number(item.discount_total ?? 0),
          product: { sku: item.variant_sku ?? "", omie_code: String(metadata.omie_external_id ?? ""), description: item.title ?? "", unit: String(metadata.unit ?? ""),
            ncm: metadata.ncm ? String(metadata.ncm) : null, cest: metadata.cest ? String(metadata.cest) : null,
            origin: metadata.origin === undefined ? null : Number(metadata.origin), cfop: metadata.cfop ? String(metadata.cfop) : null,
            cst_csosn: metadata.cst_csosn ? String(metadata.cst_csosn) : null, tax_scenario: String(taxScenario) } }
      }),
      subtotal: Number(order.subtotal), shipping: Number(order.shipping_total), total: Number(order.total), currency_code: order.currency_code,
      payment: { status: "captured", method, installments },
      shipping_method: { key: String(shipping?.data?.commercial_shipping_option ?? ""), amount: Number(shipping?.amount),
        pickup: shipping?.data?.commercial_shipping_option === "FRIGGAFRIO_PICKUP_STORE_1", state: address?.province ?? "" },
    }
    const validation = validateFiscalOrder(fiscal)
    if (!validation.valid || !fiscal.customer.address.number || !fiscal.customer.address.neighborhood
      || !/^\d{7}$/.test(fiscal.customer.address.ibge_code ?? "")
      || fiscal.items.some((item) => !/^\d+$/.test(item.product.omie_code))
      || Math.abs(fiscal.items.reduce((sum, item) => sum + item.quantity * item.unit_price - item.discount, 0) + fiscal.shipping - fiscal.total) > 0.01) {
      return { exported: false, reason: "invalid_fiscal_data" }
    }
    const client = new OmieClient(config)
    const integrationCode = fiscalIntegrationCode(order.id)
    const orders = container.resolve(Modules.ORDER)
    // Após uma tentativa incerta, consultar pelo código estável antes de qualquer nova inclusão.
    if (order.metadata?.omie_export_attempted) {
      const existing = await client.request<{ cabecalho?: { codigo_pedido?: number; numero_pedido?: string } }>("ConsultarPedido", { codigo_pedido_integracao: integrationCode })
      if (!existing.cabecalho?.codigo_pedido) throw new Error("OMIE_EXPORT_RECONCILIATION_REQUIRED")
      await orders.updateOrders([{ id: order.id, metadata: { ...order.metadata, omie_codigo_pedido: String(existing.cabecalho.codigo_pedido), omie_numero_pedido: existing.cabecalho.numero_pedido } }])
      return { exported: true, codigo_pedido: String(existing.cabecalho.codigo_pedido) }
    }
    const customer = await client.request<{ codigo_cliente_omie?: number }>("UpsertClienteCpfCnpj", { ...mapCustomerToOmieUpsert(fiscal.customer) })
    if (!customer.codigo_cliente_omie) throw new Error("OMIE_CUSTOMER_RESPONSE_INVALID")
    const payload = mapOrderToOmieOrder(fiscal, { stage, defaultCenarioImpostos: taxScenario, defaultCategory: category, defaultBankAccount: bank })
    payload.cabecalho.codigo_cliente = customer.codigo_cliente_omie
    delete payload.cabecalho.codigo_cliente_integracao
    payload.cabecalho.codigo_pedido_integracao = integrationCode
    await orders.updateOrders([{ id: order.id, metadata: { ...order.metadata, omie_export_attempted: true, omie_integration_code: integrationCode } }])
    const result = await client.request<{ codigo_pedido?: number; numero_pedido?: string }>("IncluirPedido", { ...payload })
    if (!result.codigo_pedido) throw new Error("OMIE_ORDER_RESPONSE_INVALID")
    await orders.updateOrders([{ id: order.id, metadata: { ...order.metadata, omie_export_attempted: true, omie_integration_code: integrationCode,
      omie_codigo_pedido: String(result.codigo_pedido), omie_numero_pedido: result.numero_pedido, omie_sync_status: "synced" } }])
    return { exported: true, codigo_pedido: String(result.codigo_pedido), numero_pedido: result.numero_pedido }
  })
}

export const exportMedusaOrderToOmieStep = createStep("export-medusa-order-to-omie",
  async (input: ExportOrderInput, { container }): Promise<StepResponse<ExportOrderResult>> => new StepResponse(await exportOrder(input, container)))
export const exportMedusaOrderToOmieWorkflow = createWorkflow("export-medusa-order-to-omie", (input: ExportOrderInput) =>
  new WorkflowResponse(exportMedusaOrderToOmieStep(input)))
