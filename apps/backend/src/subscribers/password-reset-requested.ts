import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { sendPasswordResetEmail } from "../lib/auth/password-reset-email"

type PasswordResetEvent = {
  entity_id?: string
  actor_type?: string
  token?: string
  metadata?: {
    redirect_url?: string
  }
}

export default async function passwordResetRequestedHandler({
  event: { data },
  container,
}: SubscriberArgs<PasswordResetEvent>): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (
    data.actor_type !== "customer" ||
    !data.entity_id ||
    !data.token
  ) {
    logger.warn("[Auth] Ignored an invalid customer password reset event.")
    return
  }

  try {
    const delivered = await sendPasswordResetEmail({
      to: data.entity_id,
      token: data.token,
      redirectPath: data.metadata?.redirect_url,
    })

    if (!delivered) {
      logger.error(
        "[Auth] Password reset email was not delivered: RESEND_API_KEY is not configured.",
      )
    }
  } catch (error) {
    logger.error(
      `[Auth] Password reset email delivery failed: ${error instanceof Error ? error.message : "unknown error"}`,
    )
  }
}

export const config: SubscriberConfig = {
  event: "auth.password_reset",
}
