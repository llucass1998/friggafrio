import type { FiscalOrderInput, FiscalState } from "./fiscal-types"
import { fiscalIntegrationCode } from "./fiscal-idempotency"
import { transitionFiscalState } from "./fiscal-state"
import { validateFiscalOrder } from "./fiscal-validation"

export type FiscalReconciliationDecision = {
  state: FiscalState
  integrationCode: string
  reason: string
  retryable: boolean
}

export const reconcileFiscalTrigger = (order: FiscalOrderInput, currentState: FiscalState = "NOT_ELIGIBLE"): FiscalReconciliationDecision => {
  if (order.payment.status === "pending") return { state: transitionFiscalState(currentState, "PAYMENT_PENDING"), integrationCode: fiscalIntegrationCode(order.medusa_order_id), reason: "payment_pending", retryable: false }
  if (order.payment.status === "refunded" && ["SALES_ORDER_CREATED", "INVOICE_PROCESSING", "NFE_AUTHORIZED"].includes(currentState)) return { state: transitionFiscalState(currentState, "REFUND_RECONCILIATION_PENDING"), integrationCode: fiscalIntegrationCode(order.medusa_order_id), reason: currentState === "NFE_AUTHORIZED" ? "payment_refunded_after_nfe" : "payment_refunded_before_nfe", retryable: false }
  if (order.payment.status === "canceled" && ["SALES_ORDER_CREATED", "INVOICE_PROCESSING", "NFE_AUTHORIZED"].includes(currentState)) return { state: transitionFiscalState(currentState, "CANCELLATION_PENDING"), integrationCode: fiscalIntegrationCode(order.medusa_order_id), reason: "payment_canceled_after_sales_order", retryable: false }
  if (!["authorized", "captured"].includes(order.payment.status)) return { state: transitionFiscalState(currentState, "NOT_ELIGIBLE"), integrationCode: fiscalIntegrationCode(order.medusa_order_id), reason: "payment_not_confirmed", retryable: false }
  const validation = validateFiscalOrder(order)
  if (!validation.valid) return { state: transitionFiscalState(currentState, "BLOCKED_MISSING_CONFIGURATION"), integrationCode: fiscalIntegrationCode(order.medusa_order_id), reason: validation.issues.map((item) => item.code).join(","), retryable: false }
  return { state: transitionFiscalState(currentState, "READY_FOR_FISCAL_SYNC"), integrationCode: fiscalIntegrationCode(order.medusa_order_id), reason: "payment_confirmed_and_reconciled", retryable: true }
}

export const reconcileExternalInvoiceState = (currentState: FiscalState, externalState: FiscalState): FiscalState => {
  if (currentState === "NFE_AUTHORIZED" && externalState === "INVOICE_PROCESSING") return currentState
  if (currentState === "NFE_CANCELLED" && externalState !== "NFE_CANCELLED") return currentState
  return transitionFiscalState(currentState, externalState)
}
