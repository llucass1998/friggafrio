import { createHash, randomBytes } from "node:crypto"

export const NEWSLETTER_CONSENT_VERSION = "2026-08"
export const NEWSLETTER_CONFIRMATION_TTL_MS = 48 * 60 * 60 * 1000

export type NewsletterStatus = "pending" | "active" | "unsubscribed" | "bounced" | "complained"

export const normalizeNewsletterEmail = (value: string): string => value.trim().toLowerCase()

export const hashNewsletterToken = (token: string): string =>
  createHash("sha256").update(token, "utf8").digest("hex")

export const createNewsletterToken = (): string => randomBytes(32).toString("base64url")

export const confirmationExpiry = (now = new Date()): Date =>
  new Date(now.getTime() + NEWSLETTER_CONFIRMATION_TTL_MS)

export const isNewsletterStatus = (value: unknown): value is NewsletterStatus =>
  value === "pending" ||
  value === "active" ||
  value === "unsubscribed" ||
  value === "bounced" ||
  value === "complained"
