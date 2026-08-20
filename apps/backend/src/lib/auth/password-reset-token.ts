import { createHash, randomUUID } from "node:crypto"

export const PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000

export const createPasswordResetId = (): string => randomUUID()

export const hashPasswordResetToken = (token: string): string =>
  createHash("sha256").update(token).digest("hex")

export const getPasswordResetExpiry = (now = Date.now()): Date =>
  new Date(now + PASSWORD_RESET_TOKEN_TTL_MS)
