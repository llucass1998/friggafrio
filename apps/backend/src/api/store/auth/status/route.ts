import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

type SessionContext = {
  actor_type?: "customer" | "user" | string
  actor_id?: string
}

/** A public, minimal session hint for bootstrapping the Storefront safely. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const session = (req as MedusaRequest & { auth_context?: SessionContext }).auth_context
  if (!session?.actor_id || (session.actor_type !== "customer" && session.actor_type !== "user")) {
    return res.status(200).json({ authenticated: false, actor: null })
  }

  if (session.actor_type === "user") {
    return res.status(200).json({ authenticated: true, actor: "user", redirect_to: "/app" })
  }

  return res.status(200).json({ authenticated: true, actor: "customer" })
}
