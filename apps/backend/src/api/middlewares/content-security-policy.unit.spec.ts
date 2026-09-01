import { contentSecurityPolicyReportOnlyOptions } from "./content-security-policy"

describe("content security policy", () => {
  it("starts in report-only mode without wildcards or unsafe execution allowances", () => {
    expect(contentSecurityPolicyReportOnlyOptions).toMatchObject({ reportOnly: true })
    const serialized = JSON.stringify(contentSecurityPolicyReportOnlyOptions)
    expect(serialized).not.toContain("*")
    expect(serialized).not.toContain("unsafe-inline")
    expect(serialized).not.toContain("unsafe-eval")
  })

  it("allows only the documented Mercado Pago, VLibras, and Google Fonts origins", () => {
    expect(contentSecurityPolicyReportOnlyOptions).toMatchObject({
      directives: {
        "default-src": ["'self'"],
        "object-src": ["'none'"],
        "script-src": ["'self'", "https://sdk.mercadopago.com", "https://vlibras.gov.br"],
        "connect-src": ["'self'", "https://api.mercadopago.com", "https://sdk.mercadopago.com", "https://vlibras.gov.br"],
        "frame-src": ["https://sdk.mercadopago.com", "https://vlibras.gov.br"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
      },
    })
  })
})
