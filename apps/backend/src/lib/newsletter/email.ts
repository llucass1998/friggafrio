import { createHash } from "node:crypto"
import { resendRequest } from "../email/resend"

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
  const templateId = process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID?.trim()
  const confirmationUrl = buildNewsletterUrl("/br/newsletter/confirm", confirmationToken)
  const unsubscribeUrl = buildNewsletterUrl("/br/newsletter/unsubscribe", unsubscribeToken)

  if (!apiKey || !from || !confirmationUrl || !unsubscribeUrl) {
    return { delivered: false, reason: "not_configured" }
  }
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f9fd;font-family:Arial,sans-serif;color:#102a43"><main style="max-width:560px;margin:32px auto;background:#fff;border:1px solid #d6e8f5;border-radius:16px;padding:32px"><h1 style="color:#0b4f8a">Confirme seu cadastro na Newsletter FriggaFrio</h1><p>Para concluir seu cadastro e receber novidades, ofertas e informações da FriggaFrio, confirme seu e-mail no botão abaixo.</p><p><a href="${confirmationUrl}" style="display:inline-block;background:#0b4f8a;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Confirmar cadastro</a></p><p style="font-size:12px;color:#526d82"><a href="${unsubscribeUrl}">Cancelar recebimento</a></p></main></body></html>`
  const content = templateId
    ? { template: { id: templateId, variables: { CONFIRMATION_URL: confirmationUrl } } }
    : { html }

  const result = await resendRequest(
    "/emails",
    {
      from,
      to: [to],
      subject: "Confirme seu cadastro na newsletter FriggaFrio",
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      ...content,
    },
    `newsletter-confirmation-${createStableDeliveryKey(to, confirmationToken)}`,
  )
  if (!result.ok || !result.id) {
    throw new Error(result.error || "Newsletter email provider did not create a message")
  }
  return { delivered: true, emailId: result.id }
}

const createStableDeliveryKey = (email: string, token: string): string =>
  createHash("sha256").update(`${email}:${token}`, "utf8").digest("hex")
