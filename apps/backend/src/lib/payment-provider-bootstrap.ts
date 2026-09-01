export const MERCADO_PAGO_PROVIDER_ID = "pp_mercado-pago_mercado-pago"

/** Keep existing region providers while ensuring the enabled sandbox provider is available. */
export const mergeRegionPaymentProviders = (
  existingProviderIds: readonly string[],
  providerId = MERCADO_PAGO_PROVIDER_ID,
): string[] => {
  const providers = new Set(
    existingProviderIds
      .map((id) => id.trim())
      .filter(Boolean),
  )

  providers.add(providerId)
  return [...providers]
}

export const isMercadoPagoSandboxEnabled = (
  environment: Readonly<Record<string, string | undefined>> = process.env,
): boolean =>
  environment.MERCADO_PAGO_ENV === "sandbox" &&
  environment.PAYMENTS_ENABLED?.trim().toLowerCase() === "true" &&
  environment.PAYMENT_PROVIDER_ENABLED?.trim().toLowerCase() === "true"
