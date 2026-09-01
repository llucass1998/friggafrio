import { FISCAL_STATES, type FiscalState } from "./fiscal-types"

const rank = new Map<FiscalState, number>(FISCAL_STATES.map((state, index) => [state, index]))
const terminal = new Set<FiscalState>(["COMPLETED", "NFE_REJECTED", "NFE_CANCELLED", "ERROR_PERMANENT"])

export const canTransitionFiscalState = (from: FiscalState, to: FiscalState): boolean => {
  if (from === to) return true
  if (terminal.has(from)) return false
  if (to === "ERROR_RETRYABLE" || to === "ERROR_PERMANENT") return true
  if (to === "NOT_ELIGIBLE") return from !== "NFE_AUTHORIZED"
  if (from === "BLOCKED_MISSING_CONFIGURATION" && (to === "VALIDATING_FISCAL_DATA" || to === "READY_FOR_FISCAL_SYNC")) return true
  if (from === "ERROR_RETRYABLE") return rank.get(to)! >= rank.get("READY_FOR_FISCAL_SYNC")!
  if (to === "REFUND_RECONCILIATION_PENDING" || to === "CANCELLATION_PENDING") return from === "NFE_AUTHORIZED" || from === "SALES_ORDER_CREATED" || from === "INVOICE_PROCESSING"
  return (rank.get(to) ?? -1) >= (rank.get(from) ?? -1)
}

export const transitionFiscalState = (from: FiscalState, to: FiscalState): FiscalState => {
  if (!canTransitionFiscalState(from, to)) throw new Error(`Invalid fiscal state transition: ${from} -> ${to}`)
  return to
}

export const isFiscalTerminal = (state: FiscalState): boolean => terminal.has(state)
