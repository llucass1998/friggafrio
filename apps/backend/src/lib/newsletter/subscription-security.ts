import { createHash, randomBytes } from "node:crypto"

export const NEWSLETTER_CONSENT_VERSION = "2026-08"

export const normalizeNewsletterEmail = (value: string): string => value.trim().toLowerCase()

export const createNewsletterToken = (): string => randomBytes(32).toString("base64url")

export const hashNewsletterToken = (token: string): string =>
  createHash("sha256").update(token, "utf8").digest("hex")

export const newsletterUnsubscribeUrl = (token: string): string | null => {
  const storefrontUrl = process.env.STOREFRONT_URL?.trim()
  if (!storefrontUrl) return null
  try {
    const url = new URL("/br/newsletter/unsubscribe", storefrontUrl)
    url.searchParams.set("token", token)
    return url.toString()
  } catch {
    return null
  }
}
