const rawBackendUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL?.trim()

if (!rawBackendUrl) {
  throw new Error("VITE_MEDUSA_BACKEND_URL não foi configurada. Verifique seu arquivo .env.")
}

export const MEDUSA_BACKEND_URL = rawBackendUrl.replace(/\/+$/, "")

export const MEDUSA_PUBLISHABLE_KEY = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY?.trim() ?? ""
