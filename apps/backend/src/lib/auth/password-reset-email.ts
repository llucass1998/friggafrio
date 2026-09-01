import { createHash } from "node:crypto"
import { getPasswordResetTokenTtlMs } from "./password-reset-token"
import { resendRequest } from "../email/resend"

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
  const expiryMinutes = Math.max(1, Math.ceil(getPasswordResetTokenTtlMs() / 60_000))

  return {
    from: emailFrom,
    to,
    subject: "Redefinição de senha — FriggaFrio",
    html: `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Redefinição de senha — FriggaFrio</title>
  </head>
  <body style="margin:0;padding:0;background:#eef6ff;color:#243b53;font-family:Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;">
    <div style="display:none!important;max-height:0;overflow:hidden;opacity:0;color:transparent;">Recebemos uma solicitação para redefinir sua senha da FriggaFrio.</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#eef6ff;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:28px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:620px;background:#ffffff;border:1px solid #d9e8f5;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;background:#0f2f57;">
                <p style="margin:0;color:#ffffff;font-size:22px;line-height:28px;font-weight:700;letter-spacing:-0.2px;">FriggaFrio</p>
                <p style="margin:6px 0 0;color:#cfe5fb;font-size:12px;line-height:18px;">Segurança da sua conta</p>
              </td>
            </tr>
            <tr>
              <td style="padding:36px 32px 12px;">
                <p style="margin:0 0 10px;color:#1268b3;font-size:12px;line-height:18px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;">Acesso à conta</p>
                <h1 style="margin:0;color:#0f2f57;font-size:28px;line-height:36px;font-weight:700;">Redefinição de senha</h1>
                <p style="margin:22px 0 0;color:#40566d;font-size:16px;line-height:26px;">Olá,</p>
                <p style="margin:10px 0 0;color:#40566d;font-size:16px;line-height:26px;">Recebemos uma solicitação para redefinir a senha da sua conta FriggaFrio.</p>
                <p style="margin:10px 0 0;color:#40566d;font-size:16px;line-height:26px;">Clique no botão abaixo para criar uma nova senha.</p>
              </td>
            </tr>
            <tr>
              <td align="left" style="padding:18px 32px 30px;">
                <a href="${safeResetUrl}" style="display:inline-block;background:#1268b3;border-radius:8px;color:#ffffff;font-size:15px;line-height:20px;font-weight:700;text-decoration:none;padding:14px 22px;">Redefinir minha senha</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 30px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;background:#eef6ff;border-left:4px solid #1268b3;border-radius:8px;">
                  <tr>
                    <td style="padding:15px 16px;">
                      <p style="margin:0;color:#0f2f57;font-size:14px;line-height:22px;font-weight:700;">Importante</p>
                      <p style="margin:5px 0 0;color:#40566d;font-size:14px;line-height:22px;">Este link expira em ${expiryMinutes} minutos e pode ser utilizado apenas uma vez.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 30px;">
                <p style="margin:0;color:#40566d;font-size:14px;line-height:22px;">Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual continuará válida.</p>
                <p style="margin:18px 0 0;color:#718096;font-size:13px;line-height:21px;">Se o botão não funcionar, copie e cole este endereço no navegador:</p>
                <p style="margin:6px 0 0;word-break:break-all;"><a href="${safeResetUrl}" style="color:#1268b3;font-size:13px;line-height:21px;">${safeResetUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px;background:#f7fafc;border-top:1px solid #e6eef5;">
                <p style="margin:0;color:#718096;font-size:12px;line-height:19px;">Este é um e-mail automático de segurança da FriggaFrio.</p>
                <p style="margin:4px 0 0;color:#718096;font-size:12px;line-height:19px;">Não responda a esta mensagem.</p>
                <p style="margin:14px 0 0;color:#718096;font-size:12px;line-height:19px;">© FriggaFrio — Todos os direitos reservados</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
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

  const templateId = process.env.RESEND_PASSWORD_RESET_TEMPLATE_ID?.trim()
  const idempotencyKey = `password-reset-${createHash("sha256").update(`${input.to}:${input.token}`, "utf8").digest("hex")}`
  if (templateId) {
    const storefrontUrl = process.env.STOREFRONT_URL?.trim()
    const emailFrom = process.env.EMAIL_FROM?.trim()
    if (!storefrontUrl || !emailFrom) return false
    const resetUrl = buildPasswordResetUrl(storefrontUrl, input.token, input.redirectPath)
    const result = await resendRequest(
      "/emails",
      {
        from: emailFrom,
        to: [input.to],
        subject: "Redefinição de senha — FriggaFrio",
        template: {
          id: templateId,
          variables: {
            CUSTOMER_NAME_OPTIONAL: "cliente",
            RESET_URL: resetUrl,
          },
        },
      },
      idempotencyKey,
    )
    if (!result.ok) throw new Error(result.error || "Password reset email provider rejected the request")
    return true
  }

  const result = await resendRequest(
    "/emails",
    buildPasswordResetEmail(input),
    idempotencyKey,
  )
  if (!result.ok) throw new Error(result.error || "Password reset email provider rejected the request")
  return true
}
