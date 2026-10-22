import { configuredAdminOrigin } from "@/lib/auth/admin-origin"
import { MEDUSA_BACKEND_URL } from "@/config/env"

// Prefer an explicit Admin origin; local development may share the API origin
// because the local Medusa server also serves /app.
// When the storefront is served from a production domain the Admin dashboard
// lives on the same origin (reverse proxy /app -> Medusa backend), so the
// existing host-only session cookie stays valid. Only fall back to the
// configured origin elsewhere (local dev sharing the API origin).
const isProductionDomain =
  typeof window !== "undefined" &&
  /^(www\.)?(friggafrio\.com\.br|friggafrio\.istigestao\.com\.br)$/.test(
    window.location.hostname,
  )

const adminOrigin = isProductionDomain
  ? window.location.origin
  : (configuredAdminOrigin(import.meta.env.VITE_MEDUSA_ADMIN_URL) ??
    (import.meta.env.DEV ? configuredAdminOrigin(MEDUSA_BACKEND_URL) : null))

// The storefront only offers a handoff to Medusa Admin's explicit entrypoint.
// It never submits customer credentials to the Admin actor.
export const ADMIN_ACCESS_URL = adminOrigin ? `${adminOrigin}/app` : null

// Same-origin admin entrypoint for production domains (computed above).
export const ADMIN_ORIGIN = adminOrigin
