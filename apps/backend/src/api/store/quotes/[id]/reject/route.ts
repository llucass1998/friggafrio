import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { customerRejectQuoteWorkflow } from "../../../../../workflows/customer-reject-quote"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params
  const customer_id = req.auth_context?.actor_id as string

  if (!customer_id) {
    return res.status(401).json({ error: "Customer must be logged in" })
  }

  await customerRejectQuoteWorkflow(req.scope).run({
    input: {
      quote_id: id,
      customer_id,
    },
  })

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      filters: { id },
      fields: req.queryConfig?.fields || ["id", "status"],
    },
    { throwIfKeyNotFound: true }
  )

  res.json({ quote })
}