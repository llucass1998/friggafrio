import Medusa from "@medusajs/js-sdk"
import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/config/env"

export const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: import.meta.env.DEV,
  publishableKey: MEDUSA_PUBLISHABLE_KEY,
  auth: {
    type: "token",
    getToken: () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem("medusa_auth_token") || ""
      }
      return ""
    }
  },
})
