import { configuredAdminOrigin } from "@/lib/auth/admin-origin"

// Admin access is opt-in per deployment; never infer it from the customer API.
const adminOrigin = configuredAdminOrigin(import.meta.env.VITE_MEDUSA_ADMIN_URL)

// The storefront only offers a handoff to Medusa Admin's explicit entrypoint.
// It never submits customer credentials to the Admin actor.
export const ADMIN_ACCESS_URL = adminOrigin ? `${adminOrigin}/app` : null
