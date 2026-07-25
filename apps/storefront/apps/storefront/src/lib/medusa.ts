import Medusa from "@medusajs/js-sdk"

export const medusaClient = new Medusa({
  baseUrl: import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000",
  maxRetries: 3,
  debug: import.meta.env.DEV,
  auth: {
    type: "session",
  },
})

// Tipagem e utilitários da SDK
export const sdk = medusaClient
