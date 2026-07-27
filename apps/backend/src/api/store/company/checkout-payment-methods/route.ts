import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    res.json({ payment_methods: [] })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  const employee = (customers[0] as { employee: { company: { id: string, status: string } } })?.employee
  if (!employee) {
    res.json({ payment_methods: [] })
    return
  }

  const company = employee.company
  if (!company || company.status !== "active") {
    res.json({ payment_methods: [] })
    return
  }

  const { data: companies } = await query.graph({
    entity: "company",
    fields: ["id", "account_holder.*"],
    filters: { id: company.id },
  })

  const accountHolder = (companies[0] as { account_holder?: { id: string } })?.account_holder
  if (!accountHolder) {
    res.json({ payment_methods: [] })
    return
  }

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as import("@medusajs/types").IPaymentModuleService

  const paymentMethods = await paymentModuleService.listPaymentMethods({
    // @ts-expect-error
    provider_id: accountHolder.provider_id,
    context: {
      account_holder: {
        // @ts-expect-error
        data: { id: accountHolder.data?.id },
      },
    },
  })

  res.json({ payment_methods: paymentMethods })
}
