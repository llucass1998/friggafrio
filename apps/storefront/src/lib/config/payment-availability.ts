import { gate8FinalizationEnabled } from "@/lib/payments/runtime"

const paymentsEnabled =
  import.meta.env.VITE_PAYMENTS_ENABLED?.trim().toLowerCase() === "true"
const providerEnabled =
  import.meta.env.VITE_PAYMENT_PROVIDER_ENABLED?.trim().toLowerCase() === "true"

export const paymentAvailability = Object.freeze({
  paymentsEnabled,
  providerEnabled,
  processingEnabled: paymentsEnabled && providerEnabled,
})

export const PAYMENT_UNAVAILABLE_MESSAGE =
  "Pagamentos estão temporariamente indisponíveis. Nenhuma cobrança será realizada."

export const assertPaymentProcessingEnabled = (): void => {
  if (!paymentAvailability.processingEnabled) {
    throw new Error(PAYMENT_UNAVAILABLE_MESSAGE)
  }
}

/**
 * Gate 8 is an explicit operational switch. Payment flags alone never open
 * order creation, which keeps a partially configured gateway fail-closed.
 */
export const assertGate8FinalizationEnabled = (): void => {
  if (!gate8FinalizationEnabled) {
    throw new Error("A finalizacao do pedido esta temporariamente indisponivel.")
  }
}
