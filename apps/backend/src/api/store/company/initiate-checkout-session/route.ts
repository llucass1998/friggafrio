import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import {
  getPaymentAvailability,
  sendPaymentUnavailable,
} from "../../../../utils/payment-availability"

const InitiateSessionSchema = z.object({
  cart_id: z.string(),
  provider_id: z.string(),
  payment_method_id: z.string(),
})

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  if (!getPaymentAvailability().processingEnabled) {
    return sendPaymentUnavailable(res)
  }

  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const body = InitiateSessionSchema.parse(req.body)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Verify the customer is a company employee
  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  const employee = (customers[0] as { employee: { company: { id: string, status: string } } })?.employee
  if (!employee) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Not a company employee"
    )
  }

  const company = employee.company
  if (!company || company.status !== "active") {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Company not found or not active"
    )
  }

  // Get the company's account holder
  const { data: companies } = await query.graph({
    entity: "company",
    fields: ["id", "account_holder.*"],
    filters: { id: company.id },
  })

  const accountHolder = (companies[0] as { account_holder?: { id: string } })?.account_holder
  if (!accountHolder) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No payment account found for this company"
    )
  }

  // Get the cart and its payment collection
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "payment_collection.*", "region.*", "currency_code"],
    filters: { id: body.cart_id },
  })

  const cart = carts[0] as { id: string, total: number, currency_code: string, customer_id: string, email: string }
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Cart not found")
  }

  // @ts-expect-error
  const paymentCollection = cart.payment_collection
  if (!paymentCollection) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No payment collection on cart"
    )
  }

  // Use the payment module to create the session with the company's account holder
  const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as import("@medusajs/types").IPaymentModuleService

  // Delete existing payment sessions to avoid conflicts
  const existingSessions = paymentCollection.payment_sessions || []
  for (const session of existingSessions) {
    try {
      await paymentModuleService.deletePaymentSession(session.id)
    } catch {
      // ignore errors on cleanup
    }
  }

  // Create new payment session with the company's account holder
  const paymentSession = await paymentModuleService.createPaymentSession(
    paymentCollection.id,
    {
      provider_id: body.provider_id,
      amount: paymentCollection.amount,
      currency_code: cart.currency_code,
      data: {
        payment_method: body.payment_method_id,
      },
      context: {
        account_holder: {
          // @ts-expect-error
          id: accountHolder.id,
          // @ts-expect-error
          data: accountHolder.data,
        },
      },
    }
  )

  res.json({ payment_session: paymentSession })
}
