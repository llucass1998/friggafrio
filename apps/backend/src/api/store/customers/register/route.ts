import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { setupCustomerWorkflow, SetupCustomerInput } from "../../../../workflows/setup-customer"
import { z } from "@medusajs/framework/zod"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const body = req.validatedBody as SetupCustomerInput

  const { result } = await setupCustomerWorkflow(req.scope).run({
    input: body,
  })

  res.status(201).json({
    customer: result.customer,
  })
}
