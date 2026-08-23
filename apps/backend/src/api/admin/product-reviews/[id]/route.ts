import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { serviceFor, statusSchema } from "../route"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const id = String(req.params.id || "").trim()
  if (!id) throw new MedusaError(MedusaError.Types.INVALID_DATA, "Review is required")

  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: "Invalid review moderation" })

  const service = serviceFor(req)
  await service.retrieveProductReview(id)
  const review = await service.updateProductReviews({
    id,
    status: parsed.data.status,
    ...(parsed.data.admin_reply !== undefined ? { admin_reply: parsed.data.admin_reply || null } : {}),
  })
  res.json({ review })
}
