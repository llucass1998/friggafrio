import type { PaymentMethodId, PaymentResult } from "@/lib/payments/contracts"
import { CheckoutStepKey } from "@/lib/types/global"

export type CheckoutPaymentMachineState = "IDLE" | "METHOD_SELECTED" | "PREPARING" | "SUBMITTING" | "PIX_PENDING" | "CARD_PROCESSING" | "APPROVED" | "REJECTED" | "EXPIRED" | "CANCELLED" | "RECOVERING" | "ERROR_RETRYABLE" | "ERROR_TERMINAL"
export type CheckoutFlowState = { addressConfirmed: boolean; deliveryConfirmed: boolean; prepared: boolean; paymentMethod: PaymentMethodId | null; paymentState: CheckoutPaymentMachineState; activeAttempt: boolean; result: PaymentResult | null }
export type CheckoutFlowAction =
  | { type: "ADDRESS_CONFIRMED" }
  | { type: "DELIVERY_CONFIRMED" }
  | { type: "PREPARED" }
  | { type: "PAYMENT_SELECTED"; method: PaymentMethodId }
  | { type: "PAYMENT_SUBMITTING"; method: PaymentMethodId }
  | { type: "PAYMENT_RECOVERING" }
  | { type: "PAYMENT_RECOVERY_EMPTY" }
  | { type: "PAYMENT_RESULT"; result: PaymentResult }
  | { type: "RESET_AFTER_ADDRESS_CHANGE" }
  | { type: "RESET_AFTER_DELIVERY_CHANGE" }

export const initialCheckoutFlowState: CheckoutFlowState = { addressConfirmed: false, deliveryConfirmed: false, prepared: false, paymentMethod: null, paymentState: "IDLE", activeAttempt: false, result: null }
const resultState = (result: PaymentResult): CheckoutPaymentMachineState => result.uiState === "pending" ? "PIX_PENDING" : result.uiState === "approved" ? "APPROVED" : result.uiState === "rejected" ? "REJECTED" : result.uiState === "expired" ? "EXPIRED" : result.uiState === "cancelled" ? "CANCELLED" : result.error?.recoverable ? "ERROR_RETRYABLE" : "ERROR_TERMINAL"
const terminalRank = (state: CheckoutPaymentMachineState): number => state === "APPROVED" || state === "REJECTED" || state === "EXPIRED" || state === "CANCELLED" ? 2 : state === "PIX_PENDING" ? 1 : 0

export const checkoutFlowReducer = (state: CheckoutFlowState, action: CheckoutFlowAction): CheckoutFlowState => {
  switch (action.type) {
    case "ADDRESS_CONFIRMED": return { ...state, addressConfirmed: true, deliveryConfirmed: false, prepared: false, paymentMethod: null, paymentState: "IDLE", result: null }
    case "DELIVERY_CONFIRMED": return { ...state, deliveryConfirmed: true, prepared: false, paymentMethod: null, paymentState: "IDLE", result: null }
    case "PREPARED": return { ...state, prepared: true, paymentState: "PREPARING" }
    case "PAYMENT_SELECTED": return { ...state, paymentMethod: action.method, paymentState: "METHOD_SELECTED", activeAttempt: false, result: null }
    case "PAYMENT_SUBMITTING": return { ...state, paymentMethod: action.method, paymentState: action.method === "card" ? "CARD_PROCESSING" : "SUBMITTING", activeAttempt: true, result: null }
    case "PAYMENT_RECOVERING": return { ...state, paymentState: "RECOVERING", activeAttempt: true }
    case "PAYMENT_RESULT": {
      const nextState = resultState(action.result)
      // Webhooks and refreshes can race. Never let a lower-ranked event move a
      // terminal payment back to pending or processing.
      if (terminalRank(nextState) < terminalRank(state.paymentState)) return state
      return { ...state, paymentState: nextState, activeAttempt: false, result: action.result }
    }
    case "PAYMENT_RECOVERY_EMPTY": return { ...state, paymentState: state.paymentMethod ? "METHOD_SELECTED" : "IDLE", activeAttempt: false }
    case "RESET_AFTER_ADDRESS_CHANGE": return { ...initialCheckoutFlowState }
    case "RESET_AFTER_DELIVERY_CHANGE": return { ...state, deliveryConfirmed: false, prepared: false, paymentMethod: null, paymentState: "IDLE", activeAttempt: false, result: null }
    default: return state
  }
}

export const canEnterCheckoutStep = (state: Pick<CheckoutFlowState, "addressConfirmed" | "deliveryConfirmed" | "prepared" | "paymentMethod">, step: CheckoutStepKey): boolean => {
  switch (step) {
    case CheckoutStepKey.ADDRESSES: return true
    case CheckoutStepKey.DELIVERY: return state.addressConfirmed
    case CheckoutStepKey.PAYMENT: return state.addressConfirmed && state.deliveryConfirmed
    case CheckoutStepKey.REVIEW: return state.addressConfirmed && state.deliveryConfirmed && state.prepared && !!state.paymentMethod
    default: return false
  }
}
