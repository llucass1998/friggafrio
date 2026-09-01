import { createHash, randomUUID } from "node:crypto"

export const DEFAULT_PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000

export const getPasswordResetTokenTtlMs = (
  env: NodeJS.ProcessEnv = process.env,
): number => {
  const configured = Number(env.PASSWORD_RESET_TOKEN_TTL_MS)
  return Number.isSafeInteger(configured) && configured >= 60_000 && configured <= 24 * 60 * 60 * 1000
    ? configured
    : DEFAULT_PASSWORD_RESET_TOKEN_TTL_MS
}

// Kept as a compatibility export for existing unit consumers.
export const PASSWORD_RESET_TOKEN_TTL_MS = getPasswordResetTokenTtlMs()

export const createPasswordResetId = (): string => randomUUID()

export const hashPasswordResetToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex")

export const getPasswordResetExpiry = (now = Date.now()): Date =>
  new Date(now + getPasswordResetTokenTtlMs())
