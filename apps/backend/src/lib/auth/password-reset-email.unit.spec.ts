import {
  buildPasswordResetEmail,
  buildPasswordResetUrl,
  isSafeResetPath,
} from "./password-reset-email"

describe("password reset email", () => {
  const originalStorefrontUrl = process.env.STOREFRONT_URL
  const originalEmailFrom = process.env.EMAIL_FROM

  afterEach(() => {
    if (originalStorefrontUrl === undefined) {
      delete process.env.STOREFRONT_URL
    } else {
      process.env.STOREFRONT_URL = originalStorefrontUrl
    }

    if (originalEmailFrom === undefined) {
      delete process.env.EMAIL_FROM
    } else {
      process.env.EMAIL_FROM = originalEmailFrom
    }
  })

  it("builds a reset URL at the configured storefront", () => {
    expect(
      buildPasswordResetUrl(
        "https://loja.example.com",
        "signed-token",
        "/br/account/reset-password",
      ),
    ).toBe(
      "https://loja.example.com/br/account/reset-password?token=signed-token",
    )
  })

  it("rejects protocol-relative redirect paths", () => {
    expect(isSafeResetPath("//malicious.example/reset")).toBe(false)
    expect(
      buildPasswordResetUrl(
        "https://loja.example.com",
        "signed-token",
        "//malicious.example/reset",
      ),
    ).toContain("https://loja.example.com/br/account/reset-password")
  })

  it("escapes the reset URL in email HTML", () => {
    process.env.STOREFRONT_URL = "https://loja.example.com"
    process.env.EMAIL_FROM = "Frigga <noreply@example.com>"

    const email = buildPasswordResetEmail({
      to: "customer@example.com",
      token: "token&unsafe",
    })

    expect(email.to).toBe("customer@example.com")
    expect(email.html).toContain("token%26unsafe")
  })

  it("requires an explicitly configured sender", () => {
    process.env.STOREFRONT_URL = "https://loja.example.com"
    delete process.env.EMAIL_FROM

    expect(() =>
      buildPasswordResetEmail({
        to: "customer@example.com",
        token: "signed-token",
      }),
    ).toThrow("EMAIL_FROM is required")
  })
})
