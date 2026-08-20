const DEFAULT_RESET_PATH = "/br/account/reset-password"

export type PasswordResetEmail = {
  to: string
  token: string
  redirectPath?: string
}

export const isSafeResetPath = (value: string | undefined): value is string =>
  Boolean(value && value.startsWith("/") && !value.startsWith("//"))

const htmlEscape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

export const buildPasswordResetUrl = (
  storefrontUrl: string,
  token: string,
  redirectPath = DEFAULT_RESET_PATH,
): string => {
  const url = new URL(
    isSafeResetPath(redirectPath) ? redirectPath : DEFAULT_RESET_PATH,
    storefrontUrl,
  )
  url.searchParams.set("token", token)
  return url.toString()
}

export const buildPasswordResetEmail = ({
  to,
  token,
  redirectPath,
}: PasswordResetEmail) => {
  const storefrontUrl = process.env.STOREFRONT_URL?.trim()
  if (!storefrontUrl) {
    throw new Error("STOREFRONT_URL is required to deliver password reset emails.")
  }

  const emailFrom = process.env.EMAIL_FROM?.trim()
  if (!emailFrom) {
    throw new Error("EMAIL_FROM is required to deliver password reset emails.")
  }

  const resetUrl = buildPasswordResetUrl(storefrontUrl, token, redirectPath)
  const safeResetUrl = htmlEscape(resetUrl)

  return {
    from: emailFrom,
    to,
    subject: "Redefina sua senha da Frigga Frio",
    html: `<p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${safeResetUrl}">Redefinir minha senha</a></p><p>Este link expira em 15 minutos. Se você não solicitou esta alteração, ignore este e-mail.</p>`,
  }
}

/**
 * Sends through Resend when configured. The event subscriber intentionally
 * does not log the token or reset URL.
 */
export const sendPasswordResetEmail = async (
  input: PasswordResetEmail,
): Promise<boolean> => {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    return false
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildPasswordResetEmail(input)),
  })

  if (!response.ok) {
    throw new Error(`Password reset email provider rejected the request (${response.status}).`)
  }

  return true
}
