import type { PaymentSessionStatus } from "@/lib/payments/contracts"

/** Maps Medusa's persisted status to the checkout's public state model. */
export const paymentSessionStatusOf = (
  status: string | undefined,
): PaymentSessionStatus => {
  switch (status) {
    case "pending":
    case "pending_authorization":
      return "pending"
    case "authorized":
      return "authorized"
    case "captured":
      return "captured"
    case "canceled":
    case "cancelled":
      return "cancelled"
    case "expired":
      return "expired"
    case "error":
      return "rejected"
    default:
      return "unknown"
  }
}
