import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  merchantSendQuoteWorkflow,
} from "../../../../../workflows/merchant-send-quote"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { id } = req.params

  // "Aprovar" o preço/desconto significa envia-lo para o customer
  // Então reutiliza o merchantSendQuoteWorkflow
  await merchantSendQuoteWorkflow(req.scope).run({
    input: {
      quote_id: id,
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