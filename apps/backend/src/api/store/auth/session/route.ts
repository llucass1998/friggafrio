import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const isAdmin = (req as MedusaRequest & { auth_context?: { actor_type?: string } }).auth_context?.actor_type === "user"

  res.status(200).json({
    authenticated: true,
    redirect_to: isAdmin ? "/app" : null,
  })
}
