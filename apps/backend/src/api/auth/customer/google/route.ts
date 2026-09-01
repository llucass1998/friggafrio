import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

/** Compatibility endpoint; the supported flow uses Authorization Code + PKCE. */
export async function POST(_req: MedusaRequest, res: MedusaResponse): Promise<void> {
  res.status(503).json({
    code: "GOOGLE_OIDC_USE_REDIRECT",
    message: "O login com Google requer o fluxo seguro de redirecionamento.",
  })
}
