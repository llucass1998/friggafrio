import {
  MERCADO_PAGO_PROVIDER_ID,
  isMercadoPagoSandboxEnabled,
  mergeRegionPaymentProviders,
} from "./payment-provider-bootstrap"

describe("Mercado Pago region bootstrap", () => {
  it("adds Mercado Pago without dropping an existing regional provider", () => {
    expect(mergeRegionPaymentProviders(["pp_system_default"])).toEqual([
      "pp_system_default",
      MERCADO_PAGO_PROVIDER_ID,
    ])
  })

  it("is idempotent when Mercado Pago is already linked", () => {
    expect(
      mergeRegionPaymentProviders([
        "pp_system_default",
        MERCADO_PAGO_PROVIDER_ID,
        MERCADO_PAGO_PROVIDER_ID,
      ]),
    ).toEqual(["pp_system_default", MERCADO_PAGO_PROVIDER_ID])
  })

  it("requires the explicit sandbox and payment flags", () => {
    expect(
      isMercadoPagoSandboxEnabled({
        MERCADO_PAGO_ENV: "sandbox",
        PAYMENTS_ENABLED: "true",
        PAYMENT_PROVIDER_ENABLED: "true",
      }),
    ).toBe(true)
    expect(isMercadoPagoSandboxEnabled({ MERCADO_PAGO_ENV: "production" })).toBe(
      false,
    )
  })
})
