import { resolveMedusaBackendUrl } from "@/config/runtime-backend-url"

const rawBackendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL?.trim()
const runtimeHostname = typeof window !== "undefined" ? window.location.hostname : undefined

export const MEDUSA_BACKEND_URL = resolveMedusaBackendUrl(rawBackendUrl, runtimeHostname)

export const MEDUSA_PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim() ?? ""
