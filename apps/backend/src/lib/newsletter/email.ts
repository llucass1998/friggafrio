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
      process.env.RESEND_NEWSLETTER_CONFIRMATION_TEMPLATE_ID?.trim() &&
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

  if (!apiKey || !from || !templateId || !confirmationUrl || !unsubscribeUrl) {
    return { delivered: false, reason: "not_configured" }
  }

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
      template: {
        id: templateId,
        // Resend resolves contact.first_name and RESEND_UNSUBSCRIBE_URL natively.
        // The confirmation target is the only application-owned variable.
        variables: { CONFIRMATION_URL: confirmationUrl },
      },
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
