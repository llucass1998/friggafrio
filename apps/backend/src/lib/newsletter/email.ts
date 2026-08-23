import { createHash } from "node:crypto"
import { MedusaError } from "@medusajs/framework/utils"

const htmlEscape = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;")

const storefrontOrigin = (): string | null => {
  const value = process.env.STOREFRONT_URL?.trim()
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export const newsletterEmailConfiguration = () => ({
  configured: Boolean(
    process.env.RESEND_API_KEY?.trim() &&
      process.env.EMAIL_FROM?.trim() &&
      storefrontOrigin(),
  ),
  senderConfigured: Boolean(process.env.EMAIL_FROM?.trim()),
})

export const buildNewsletterUrl = (path: "/br/newsletter/confirm" | "/br/newsletter/unsubscribe", token: string): string | null => {
  const origin = storefrontOrigin()
  if (!origin) return null
  return `${origin}${path}?token=${encodeURIComponent(token)}`
}

export type NewsletterEmailDelivery =
  | { delivered: false; reason: "not_configured" }
  | { delivered: true; emailId: string | null }

/** Sends only a confirmation request; no promotional email is sent from this flow. */
export const sendNewsletterConfirmationEmail = async ({
  to,
  confirmationToken,
  unsubscribeToken,
}: {
  to: string
  confirmationToken: string
  unsubscribeToken: string
}): Promise<NewsletterEmailDelivery> => {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = process.env.EMAIL_FROM?.trim()
  const confirmationUrl = buildNewsletterUrl("/br/newsletter/confirm", confirmationToken)
  const unsubscribeUrl = buildNewsletterUrl("/br/newsletter/unsubscribe", unsubscribeToken)

  if (!apiKey || !from || !confirmationUrl || !unsubscribeUrl) {
    return { delivered: false, reason: "not_configured" }
  }

  const safeConfirmationUrl = htmlEscape(confirmationUrl)
  const safeUnsubscribeUrl = htmlEscape(unsubscribeUrl)
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `newsletter-confirmation-${createStableDeliveryKey(to, confirmationToken)}`,
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Confirme seu cadastro na newsletter FriggaFrio",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      text: `Confirme seu cadastro na newsletter FriggaFrio: ${confirmationUrl}\n\nPara cancelar futuras comunicações: ${unsubscribeUrl}`,
      html: `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f9fc;color:#12304d;font-family:Arial,sans-serif"><main style="max-width:600px;margin:24px auto;background:#fff;border:1px solid #d9e8f2;border-radius:20px;padding:32px"><p style="margin:0;color:#1769aa;font-size:12px;font-weight:700;letter-spacing:1.2px">NOVIDADES FRIGGAFRIO</p><h1 style="margin:12px 0 16px;font-size:26px">Confirme seu cadastro</h1><p style="line-height:1.6">Use o botão abaixo para confirmar que deseja receber novidades, conteúdos técnicos e ofertas selecionadas da FriggaFrio.</p><p style="margin:28px 0"><a href="${safeConfirmationUrl}" style="display:inline-block;background:#0f5f9f;color:#fff;border-radius:8px;padding:14px 20px;font-weight:700;text-decoration:none">Confirmar cadastro</a></p><p style="font-size:13px;line-height:1.5;color:#526b80">Se você não solicitou este cadastro, ignore este e-mail. Não enviaremos comunicações promocionais antes da confirmação.</p><p style="font-size:12px;color:#526b80">Para cancelar futuras comunicações, <a href="${safeUnsubscribeUrl}">descadastre-se aqui</a>.</p></main></body></html>`,
    }),
  })

  if (!response.ok) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      `Newsletter email provider rejected the request (${response.status}).`,
    )
  }

  const data = await response.json() as { id?: unknown }
  return { delivered: true, emailId: typeof data.id === "string" ? data.id : null }
}

const createStableDeliveryKey = (email: string, token: string): string =>
  createHash("sha256").update(`${email}:${token}`, "utf8").digest("hex")
