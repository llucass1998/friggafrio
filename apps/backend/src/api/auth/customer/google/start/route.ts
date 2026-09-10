import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import {
  buildGoogleAuthorizationUrl,
  createGoogleOidcSession,
  getGoogleOidcConfig,
  normalizeGoogleReturnTo,
  type GoogleOidcSession,
} from "../../../../../lib/auth/google-oidc"

type SessionWithSave = {
  google_oidc?: GoogleOidcSession
  save: (callback: (error?: Error | null) => void) => void
}

export const GET = async (req: MedusaRequest, res: MedusaResponse): Promise<void> => {
  const config = getGoogleOidcConfig(process.env, req)
  if (!config) {
    res.status(503).json({
      code: "GOOGLE_OIDC_EXTERNAL_CONFIGURATION_REQUIRED",
      message: "O login com Google ainda não está configurado neste ambiente.",
    })
    return
  }

  const session = createGoogleOidcSession(
    normalizeGoogleReturnTo(req.query?.return_to, config.storefrontOrigin),
    config.redirectUri,
    config.storefrontOrigin,
  )
  const requestSession = req.session as unknown as SessionWithSave
  requestSession.google_oidc = session
  await new Promise<void>((resolve, reject) => {
    requestSession.save((error) => (error ? reject(error) : resolve()))
  })
  res.redirect(302, buildGoogleAuthorizationUrl(config, session))
}
