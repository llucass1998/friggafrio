import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createRequestForQuoteWorkflow } from "../../../workflows/create-request-for-quote"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // O lojista autenticado (ou customer) pode ver as proprias quotes.
  // Em store a API deve mostrar soh quotes do usuario logado (customer_id).
  const customerId = req.auth_context?.actor_id;

  const filters: any = {};
  if (customerId) {
    filters.customer_id = customerId;
  }

  const { data: quotes, metadata } = await query.graph({
    entity: "quote",
    filters,
    ...req.queryConfig,
  })

  res.json({
    quotes,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { cart_id } = req.body as { cart_id: string }
  const customer_id = req.auth_context?.actor_id as string

  if (!cart_id || !customer_id) {
    return res.status(400).json({ error: "cart_id is required and customer must be logged in" })
  }

  const { result } = await createRequestForQuoteWorkflow(req.scope).run({
    input: {
      cart_id,
      customer_id,
    }
  })

  res.json(result)
}
