type RuntimeEnv = {
  DEV?: boolean
  MODE?: string
  VITE_CHECKOUT_PAYMENT_MOCK?: string
  VITE_PAYMENTS_ENABLED?: string
  VITE_PAYMENT_PROVIDER_ENABLED?: string
  VITE_MERCADO_PAGO_PUBLIC_KEY?: string
  VITE_PAYMENT_PROVIDER_ID?: string
}

const runtimeEnv = ((import.meta as ImportMeta & { env?: RuntimeEnv }).env || {})

export const isPaymentDevelopmentMockEnabled =
  (runtimeEnv.DEV === true || runtimeEnv.MODE === "test") &&
  runtimeEnv.VITE_CHECKOUT_PAYMENT_MOCK?.trim().toLowerCase() === "true"

export const isPaymentBackendConfigured =
  runtimeEnv.VITE_PAYMENTS_ENABLED?.trim().toLowerCase() === "true" &&
  runtimeEnv.VITE_PAYMENT_PROVIDER_ENABLED?.trim().toLowerCase() === "true"

export const mercadoPagoPublicKey = runtimeEnv.VITE_MERCADO_PAGO_PUBLIC_KEY?.trim() || ""
export const mercadoPagoProviderId = runtimeEnv.VITE_PAYMENT_PROVIDER_ID?.trim() || "pp_mercado-pago_mercado-pago"
export const isMercadoPagoFrontendConfigured = isPaymentBackendConfigured && Boolean(mercadoPagoPublicKey)

export const isPaymentProduction = runtimeEnv.MODE === "production"
