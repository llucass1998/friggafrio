import {
  PASSWORD_RESET_TOKEN_TTL_MS,
  getPasswordResetExpiry,
  hashPasswordResetToken,
} from "./password-reset-token"

describe("password reset token persistence helpers", () => {
  it("hashes the raw token without retaining its value", () => {
    const rawToken = "header.payload.signature"
    const hash = hashPasswordResetToken(rawToken)

    expect(hash).not.toContain(rawToken)
    expect(hash).toHaveLength(64)
    expect(hashPasswordResetToken(rawToken)).toBe(hash)
  })

  it("sets the durable record expiry to fifteen minutes", () => {
    const now = Date.UTC(2026, 7, 19, 12, 0, 0)

    expect(getPasswordResetExpiry(now).getTime()).toBe(
      now + PASSWORD_RESET_TOKEN_TTL_MS,
    )
  })
})
