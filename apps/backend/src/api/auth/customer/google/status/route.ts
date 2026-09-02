import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { getGoogleOidcConfig } from "../../../../../lib/auth/google-oidc"

/** Reports OIDC readiness without exposing provider configuration or secrets. */
export const GET = (_req: MedusaRequest, res: MedusaResponse): void => {
  res.status(200).json({ available: Boolean(getGoogleOidcConfig()) })
}
