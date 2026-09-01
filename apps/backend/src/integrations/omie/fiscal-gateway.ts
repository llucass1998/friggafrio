import type { FiscalEnvironment, FiscalOrderInput, FiscalState } from "./fiscal-types"
import { assertFiscalPayloadSafe, fiscalIdempotencyKeys, fiscalIntegrationCode } from "./fiscal-idempotency"

export type OmieFiscalGateway = {
  findCustomer(input: FiscalOrderInput["customer"]): Promise<{ id: string } | null>
  createCustomer(input: FiscalOrderInput["customer"], idempotencyKey: string): Promise<{ id: string }>
  findSalesOrder(integrationCode: string): Promise<{ id: string; status?: string } | null>
  createSalesOrder(input: FiscalOrderInput, idempotencyKey: string): Promise<{ id: string }>
  validateSalesOrder(orderId: string): Promise<{ valid: boolean; message?: string }>
  requestInvoice(orderId: string, idempotencyKey: string): Promise<{ id: string }>
  getInvoiceStatus(invoiceId: string): Promise<{ state: FiscalState; reference?: Record<string, string | null> }>
  cancelInvoice(invoiceId: string, reason: string, idempotencyKey: string): Promise<{ accepted: boolean }>
}

export type FiscalGatewayConfig = {
  environment: FiscalEnvironment
  writesEnabled: boolean
}

export class FiscalWritesDisabledError extends Error {
  constructor(operation: string) {
    super(`Fiscal write disabled: ${operation}`)
    this.name = "FiscalWritesDisabledError"
  }
}

const disabled = (operation: string): never => {
  throw new FiscalWritesDisabledError(operation)
}

/**
 * Local default gateway. It deliberately never reaches Omie; homologation
 * transport can be injected later behind the same typed contract.
 */
export class LocalOmieFiscalGateway implements OmieFiscalGateway {
  constructor(private readonly config: FiscalGatewayConfig = { environment: "homologation", writesEnabled: false }) {}

  private guard(operation: string): void {
    if (!this.config.writesEnabled || this.config.environment !== "homologation") disabled(operation)
  }

  async findCustomer(_input: FiscalOrderInput["customer"]): Promise<{ id: string } | null> { return disabled("findCustomer") }
  async createCustomer(_input: FiscalOrderInput["customer"], _idempotencyKey: string): Promise<{ id: string }> { this.guard("createCustomer"); return disabled("createCustomer") }
  async findSalesOrder(_integrationCode: string): Promise<{ id: string; status?: string } | null> { return disabled("findSalesOrder") }
  async createSalesOrder(_input: FiscalOrderInput, _idempotencyKey: string): Promise<{ id: string }> { this.guard("createSalesOrder"); return disabled("createSalesOrder") }
  async validateSalesOrder(_orderId: string): Promise<{ valid: boolean; message?: string }> { this.guard("validateSalesOrder"); return disabled("validateSalesOrder") }
  async requestInvoice(_orderId: string, _idempotencyKey: string): Promise<{ id: string }> { this.guard("requestInvoice"); return disabled("requestInvoice") }
  async getInvoiceStatus(_invoiceId: string): Promise<{ state: FiscalState; reference?: Record<string, string | null> }> { return disabled("getInvoiceStatus") }
  async cancelInvoice(_invoiceId: string, _reason: string, _idempotencyKey: string): Promise<{ accepted: boolean }> { this.guard("cancelInvoice"); return disabled("cancelInvoice") }
}

export const fiscalGatewayConfigFromEnv = (env: NodeJS.ProcessEnv = process.env): FiscalGatewayConfig => ({
  environment: env.OMIE_NFE_ENVIRONMENT === "production" ? "production" : "homologation",
  writesEnabled: env.OMIE_FISCAL_WRITES_ENABLED === "true" && env.OMIE_NFE_ENVIRONMENT === "homologation",
})

export const buildFiscalOperationPlan = (order: FiscalOrderInput) => {
  const keys = fiscalIdempotencyKeys(order)
  const integrationCode = fiscalIntegrationCode(order.medusa_order_id)
  const plan = {
    integrationCode,
    idempotency: keys,
    trigger: "PAYMENT_CONFIRMED_AND_RECONCILED" as const,
    environment: "homologation" as const,
    steps: ["validate_fiscal_data", "sync_customer", "create_sales_order", "validate_sales_order", "request_invoice", "poll_invoice", "secure_document_access"],
  }
  assertFiscalPayloadSafe(plan)
  return plan
}
