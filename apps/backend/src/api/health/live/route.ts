import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = (req: MedusaRequest, res: MedusaResponse) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
}
