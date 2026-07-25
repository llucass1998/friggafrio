import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    // Basic verification: Check if we can resolve core services.
    // In a real scenario you would ping DB here if possible, but Medusa's health checks often rely on module connections.
    const dbConfig = process.env.DATABASE_URL
    if (!dbConfig) {
       res.status(503).json({ status: "unavailable", reason: "Missing DB configuration" })
       return
    }

    res.status(200).json({ status: "ready" })
  } catch (error) {
    res.status(503).json({ status: "unavailable", error: error.message })
  }
}
