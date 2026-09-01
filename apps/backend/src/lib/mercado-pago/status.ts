import { PaymentSessionStatus } from "@medusajs/framework/utils"

export type MercadoPagoPaymentStatus = "created" | "pending" | "in_process" | "authorized" | "approved" | "captured" | "processed" | "failed" | "rejected" | "cancelled" | "expired" | "refunded" | "partially_refunded" | "charged_back"

export const toMedusaPaymentStatus = (status: string): PaymentSessionStatus => {
  switch (status) {
    case "created": case "pending": case "in_process": case "action_required": return PaymentSessionStatus.PENDING_AUTHORIZATION
    case "authorized": return PaymentSessionStatus.AUTHORIZED
    // Orders API uses processed for a successfully accredited card payment.
    case "approved": case "captured": case "processed": return PaymentSessionStatus.CAPTURED
    case "failed": case "rejected": return PaymentSessionStatus.ERROR
    case "cancelled": case "expired": case "refunded": case "partially_refunded": case "charged_back": return PaymentSessionStatus.CANCELED
    default: return PaymentSessionStatus.ERROR
  }
}

const finalStates = new Set<MercadoPagoPaymentStatus>(["approved", "captured", "failed", "rejected", "cancelled", "expired", "refunded", "charged_back"])
export const canTransitionMercadoPagoState = (current: MercadoPagoPaymentStatus | undefined, next: MercadoPagoPaymentStatus): boolean => {
  if (!current || current === next) return true
  if (finalStates.has(current)) return false
  if (current === "partially_refunded") return next === "refunded"
  return true
}
