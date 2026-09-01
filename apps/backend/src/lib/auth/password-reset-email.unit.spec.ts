import {
  buildPasswordResetEmail,
  buildPasswordResetUrl,
  isSafeResetPath,
  sendPasswordResetEmail,
} from "./password-reset-email"

describe("password reset email", () => {
  const originalStorefrontUrl = process.env.STOREFRONT_URL
  const originalEmailFrom = process.env.EMAIL_FROM
  const originalResendApiKey = process.env.RESEND_API_KEY

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

    if (originalResendApiKey === undefined) {
      delete process.env.RESEND_API_KEY
    } else {
      process.env.RESEND_API_KEY = originalResendApiKey
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
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"

    const email = buildPasswordResetEmail({
      to: "customer@example.com",
      token: "token&unsafe",
    })

    expect(email.to).toBe("customer@example.com")
    expect(email.from).toBe("FriggaFrio <nao-responda@friggafrio.istigestao.com.br>")
    expect(email.subject).toBe("Redefinição de senha — FriggaFrio")
    expect(email.html).toContain("token%26unsafe")
    expect(email.html.match(/href="[^"]+"/g)).toHaveLength(2)
    expect(email.html).toContain("Recebemos uma solicitação para redefinir sua senha da FriggaFrio.")
    expect(email.html).toContain("Este link expira em 15 minutos e pode ser utilizado apenas uma vez.")
    expect(email.html).toContain("Se você não solicitou esta alteração, ignore este e-mail.")
    expect(email.html).toContain("FriggaFrio")
    expect(email.html).toContain("style=\"")
    expect(email.html).toContain("table role=\"presentation\"")
    expect(email.html).not.toContain("RESEND_API_KEY")
    expect(email.html).not.toContain("password hash")
  })

  it("uses the dynamic reset URL in both the button and fallback link", () => {
    process.env.STOREFRONT_URL = "https://friggafrio.istigestao.com.br"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"

    const email = buildPasswordResetEmail({
      to: "customer@example.com",
      token: "signed-token",
      redirectPath: "/br/account/reset-password",
    })

    const expectedUrl = "https://friggafrio.istigestao.com.br/br/account/reset-password?token=signed-token"
    expect(email.html.split(expectedUrl).length - 1).toBe(3)
    expect(email.html).toContain("Redefinir minha senha")
  })

  it("reflects the configured token lifetime in the email copy", () => {
    process.env.STOREFRONT_URL = "https://loja.example.com"
    process.env.EMAIL_FROM = "FriggaFrio <nao-responda@friggafrio.istigestao.com.br>"
    const previousTtl = process.env.PASSWORD_RESET_TOKEN_TTL_MS
    process.env.PASSWORD_RESET_TOKEN_TTL_MS = "3600000"

    try {
      const email = buildPasswordResetEmail({ to: "customer@example.com", token: "signed-token" })
      expect(email.html).toContain("Este link expira em 60 minutos")
    } finally {
      if (previousTtl === undefined) delete process.env.PASSWORD_RESET_TOKEN_TTL_MS
      else process.env.PASSWORD_RESET_TOKEN_TTL_MS = previousTtl
    }
  })

  it("does not report fake delivery when Resend is not configured", async () => {
    delete process.env.RESEND_API_KEY
    await expect(sendPasswordResetEmail({
      to: "customer@example.com",
      token: "signed-token",
    })).resolves.toBe(false)
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
