import {
  getAuthContextFromJwtToken,
  type MedusaRequest,
  type MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import type { IAuthModuleService, ILockingModule } from "@medusajs/framework/types"
import PasswordResetTokenService from "../../../../../modules/password-reset-token/service"
import { PASSWORD_RESET_TOKEN_MODULE } from "../../../../../modules/password-reset-token"
import {
  createPasswordResetId,
  hashPasswordResetToken,
} from "../../../../../lib/auth/password-reset-token"

type PasswordResetConfirmation = {
  token: string
  password: string
}

type SessionWithDestroy = {
  destroy?: (callback: (error?: Error | null) => void) => void
}

type ResetTokenClaims = {
  entity_id?: string
  provider?: string
  actor_type?: string
  purpose?: string
  jti?: string
}

/**
 * Verifies a short-lived reset token and delegates password hashing to emailpass.
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> => {
  const { token, password } = req.validatedBody as PasswordResetConfirmation
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig

  const claims = getAuthContextFromJwtToken(
    `Bearer ${token}`,
    config.http.jwtSecret!,
    ["bearer"],
    ["customer"],
    config.http.jwtPublicKey,
    config.http.jwtVerifyOptions ?? config.http.jwtOptions,
  ) as ResetTokenClaims | null

  if (
    !claims ||
    claims.actor_type !== "customer" ||
    claims.provider !== "emailpass" ||
    claims.purpose !== "reset" ||
    !claims.entity_id ||
    !claims.jti
  ) {
    res.status(400).json({
      code: "INVALID_PASSWORD_RESET_TOKEN",
      message: "O link para redefinir a senha e invalido ou expirou.",
    })
    return
  }

  const authModule = req.scope.resolve<IAuthModuleService>(Modules.AUTH)
  const tokenHash = hashPasswordResetToken(token)
  const locking = req.scope.resolve<ILockingModule>(Modules.LOCKING)
  const lockKey = `password-reset:consume:${tokenHash}`
  const lockOwner = createPasswordResetId()
  const resetTokenService = req.scope.resolve<PasswordResetTokenService>(
    PASSWORD_RESET_TOKEN_MODULE,
  )

  try {
    await locking.acquire(lockKey, { ownerId: lockOwner, expire: 10 })
    const [storedToken] = await resetTokenService.listPasswordResetTokens({
      token_hash: tokenHash,
      consumed_at: null,
    })

    if (
      !storedToken ||
      storedToken.customer_email !== claims.entity_id ||
      new Date(storedToken.expires_at).getTime() <= Date.now()
    ) {
      res.status(400).json({
        code: "INVALID_PASSWORD_RESET_TOKEN",
        message: "O link para redefinir a senha e invalido ou expirou.",
      })
      return
    }

    const { success } = await authModule.updateProvider("emailpass", {
      entity_id: claims.entity_id,
      password,
    })

    if (!success) {
      res.status(400).json({
        code: "INVALID_PASSWORD_RESET_TOKEN",
        message: "O link para redefinir a senha e invalido ou expirou.",
      })
      return
    }

    // Keep the token available when the provider rejects the update. The
    // database-backed lock still serializes concurrent confirmations, and the
    // successful credential update is followed immediately by single-use
    // consumption before the lock is released.
    await resetTokenService.updatePasswordResetTokens({
      id: storedToken.id,
      consumed_at: new Date(),
    })
  } catch {
    res.status(400).json({
      code: "INVALID_PASSWORD_RESET_TOKEN",
      message: "O link para redefinir a senha e invalido ou expirou.",
    })
    return
  } finally {
    await locking.release(lockKey, { ownerId: lockOwner }).catch(() => undefined)
  }

  // A reset must not leave the browser session that initiated the flow alive.
  // Existing sessions are independently bounded by the server-side TTL.
  const session = req.session as unknown as SessionWithDestroy | undefined
  if (session && typeof session.destroy === "function") {
    await new Promise<void>((resolve) => session.destroy?.(() => resolve()))
  }

  res.status(200).json({ success: true })
}
