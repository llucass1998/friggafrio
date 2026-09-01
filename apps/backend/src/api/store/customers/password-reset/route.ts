import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import type {
  IAuthModuleService,
  IEventBusModuleService,
  ILockingModule,
} from "@medusajs/framework/types"
import { sign } from "jsonwebtoken"
import PasswordResetTokenService from "../../../../modules/password-reset-token/service"
import { PASSWORD_RESET_TOKEN_MODULE } from "../../../../modules/password-reset-token"
import {
  createPasswordResetId,
  getPasswordResetExpiry,
  getPasswordResetTokenTtlMs,
  hashPasswordResetToken,
} from "../../../../lib/auth/password-reset-token"

type PasswordResetRequest = {
  email: string
  redirect_url?: string
}

const DEFAULT_RESET_PATH = "/br/account/reset-password"

/**
 * Starts a password reset without revealing whether the customer exists.
 * The reset event is delivered by the auth.password_reset subscriber.
 */
export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse,
): Promise<void> => {
  const { email, redirect_url } = req.validatedBody as PasswordResetRequest
  const config = req.scope.resolve(ContainerRegistrationKeys.CONFIG_MODULE)
    .projectConfig

  const authModule = req.scope.resolve<IAuthModuleService>(Modules.AUTH)
  const providerIdentities = await authModule.listProviderIdentities({
    entity_id: email,
    provider: "emailpass",
  })

  // Return the same accepted response either way, but avoid sending reset
  // emails to addresses that have no password-based customer identity.
  if (!providerIdentities.length) {
    res.status(202).json({
      success: true,
      message:
        "Se houver uma conta com este e-mail, enviaremos instruções para redefinir a senha.",
    })
    return
  }

  const locking = req.scope.resolve<ILockingModule>(Modules.LOCKING)
  const lockKey = `password-reset:issue:${hashPasswordResetToken(email)}`
  const lockOwner = createPasswordResetId()
  const resetTokenService = req.scope.resolve<PasswordResetTokenService>(
    PASSWORD_RESET_TOKEN_MODULE,
  )
  let token: string

  await locking.acquire(lockKey, { ownerId: lockOwner, expire: 10 })
  try {
    const now = new Date()
    const activeTokens = await resetTokenService.listPasswordResetTokens({
      customer_email: email,
      consumed_at: null,
    })

    if (activeTokens.length) {
      await resetTokenService.updatePasswordResetTokens(
        activeTokens.map((activeToken) => ({
          id: activeToken.id,
          consumed_at: now,
        })),
      )
    }

    const jti = createPasswordResetId()
    token = sign(
      {
        entity_id: email,
        actor_type: "customer",
        provider: "emailpass",
        purpose: "reset",
        jti,
      },
      config.http.jwtSecret!,
      { expiresIn: Math.floor(getPasswordResetTokenTtlMs() / 1000) },
    )

    await resetTokenService.createPasswordResetTokens({
      token_hash: hashPasswordResetToken(token),
      customer_email: email,
      expires_at: getPasswordResetExpiry(now.getTime()),
    })
  } finally {
    await locking.release(lockKey, { ownerId: lockOwner }).catch(() => undefined)
  }

  const eventBus = req.scope.resolve<IEventBusModuleService>(Modules.EVENT_BUS)
  await eventBus.emit({
    name: "auth.password_reset",
    data: {
      entity_id: email,
      actor_type: "customer",
      token: token!,
      metadata: {
        redirect_url: redirect_url || DEFAULT_RESET_PATH,
      },
    },
  })

  res.status(202).json({
    success: true,
    message:
      "Se houver uma conta com este e-mail, enviaremos instruções para redefinir a senha.",
  })
}
