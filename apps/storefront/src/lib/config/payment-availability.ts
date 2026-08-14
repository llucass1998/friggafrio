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

// Gate 8 finalization is intentionally closed while Gate 7 only prepares carts.
export const assertGate8FinalizationEnabled = (): void => {
  throw new Error("A finalizacao do pedido sera habilitada em uma etapa futura.")
}
