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
