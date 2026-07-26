export const PAYMENT_UNAVAILABLE_CODE = "payments_temporarily_unavailable"
export const PAYMENT_UNAVAILABLE_MESSAGE =
  "Pagamentos estão temporariamente indisponíveis. Nenhuma cobrança foi realizada."

type PaymentEnvironment = Readonly<Record<string, string | undefined>>

export type PaymentAvailability = {
  paymentsEnabled: boolean
  providerEnabled: boolean
  processingEnabled: boolean
}

const isExplicitlyEnabled = (value: string | undefined): boolean =>
  value?.trim().toLowerCase() === "true"

export const getPaymentAvailability = (
  environment: PaymentEnvironment = process.env
): PaymentAvailability => {
  const paymentsEnabled = isExplicitlyEnabled(environment.PAYMENTS_ENABLED)
  const providerEnabled = isExplicitlyEnabled(
    environment.PAYMENT_PROVIDER_ENABLED
  )

  return {
    paymentsEnabled,
    providerEnabled,
    processingEnabled: paymentsEnabled && providerEnabled,
  }
}

type PaymentUnavailableBody = {
  type: "temporarily_unavailable"
  code: typeof PAYMENT_UNAVAILABLE_CODE
  message: typeof PAYMENT_UNAVAILABLE_MESSAGE
}

type PaymentResponse = {
  status: (statusCode: number) => {
    json: (body: PaymentUnavailableBody) => unknown
  }
}

export const sendPaymentUnavailable = (response: PaymentResponse): unknown =>
  response.status(503).json({
    type: "temporarily_unavailable",
    code: PAYMENT_UNAVAILABLE_CODE,
    message: PAYMENT_UNAVAILABLE_MESSAGE,
  })
