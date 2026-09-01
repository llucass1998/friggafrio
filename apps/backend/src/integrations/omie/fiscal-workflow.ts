import type { FiscalOrderInput, FiscalState } from "./fiscal-types"
import { buildFiscalOperationPlan } from "./fiscal-gateway"
import { reconcileFiscalTrigger } from "./fiscal-reconciliation"

export type FiscalWorkflowDecision = {
  state: FiscalState
  integrationCode: string
  outboxEventKey: string | null
  eventType: "PAYMENT_CONFIRMED_AND_RECONCILED" | "RETRY_REQUIRED" | "CANCELLATION_REQUESTED" | "REFUND_RECONCILIATION" | null
  reason: string
}

/** Computes the durable projection/outbox intent without invoking Omie. */
export const buildFiscalWorkflowDecision = (order: FiscalOrderInput, currentState: FiscalState = "NOT_ELIGIBLE"): FiscalWorkflowDecision => {
  const reconciliation = reconcileFiscalTrigger(order, currentState)
  if (reconciliation.state !== "READY_FOR_FISCAL_SYNC") {
    return { ...reconciliation, outboxEventKey: null, eventType: null }
  }
  const plan = buildFiscalOperationPlan(order)
  return {
    state: reconciliation.state,
    integrationCode: plan.integrationCode,
    outboxEventKey: `fiscal:${plan.integrationCode}:payment-confirmed`,
    eventType: "PAYMENT_CONFIRMED_AND_RECONCILED",
    reason: reconciliation.reason,
  }
}

export const fiscalRetryAt = (attempts: number, now = Date.now()): Date => {
  const bounded = Math.max(0, Math.min(16, Math.trunc(attempts)))
  const delay = Math.min(60 * 60 * 1000, 1000 * 2 ** bounded)
  return new Date(now + delay)
}
