import { configuredAdminOrigin } from "@/lib/auth/admin-origin"
import { MEDUSA_BACKEND_URL } from "@/config/env"

const adminOrigin =
  configuredAdminOrigin(import.meta.env.VITE_MEDUSA_ADMIN_URL) ??
  (import.meta.env.DEV ? configuredAdminOrigin(MEDUSA_BACKEND_URL) : null)

// The storefront only offers a handoff to Medusa Admin's explicit entrypoint.
// It never submits customer credentials to the Admin actor.
export const ADMIN_ACCESS_URL = adminOrigin ? `${adminOrigin}/app` : null
