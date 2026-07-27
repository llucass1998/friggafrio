import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { isStripeConfigured } from "../../../../utils/is-stripe-configured"
import { createCompanyAccountHolderWorkflow } from "../../../../workflows/create-company-account-holder"

interface QueryCompany {
  id: string
  name: string
  email: string
}

interface QueryEmployee {
  is_admin: boolean
  company: QueryCompany
}

interface QueryCustomer {
  id: string
  employee?: QueryEmployee
}

interface QueryAccountHolder {
  id: string
  provider_id?: string
  data?: {
    id?: string
  }
}

interface QueryCompanyWithHolder {
  id: string
  account_holder?: QueryAccountHolder
}

async function getCompanyAccountHolder(
  req: AuthenticatedMedusaRequest
): Promise<{ company_id: string; company_name: string; company_email: string; account_holder: QueryAccountHolder | null }> {
  const customerId = req.auth_context?.actor_id
  if (!customerId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Unauthorized")
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.*", "employee.company.*"],
    filters: { id: customerId },
  })

  if (!customers || customers.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found")
  }

  const customer = customers[0] as unknown as QueryCustomer
  const employee = customer.employee

  if (!employee?.is_admin) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "Only company admins can manage payment methods"
    )
  }

  const company = employee.company
  if (!company) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found")
  }

  const { data: companies } = await query.graph({
    entity: "company",
    fields: ["id", "account_holder.*"],
    filters: { id: company.id },
  })

  if (!companies || companies.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found in graph")
  }

  const companyRecord = companies[0] as unknown as QueryCompanyWithHolder
  const accountHolder = companyRecord.account_holder

  const companyInfo = { company_id: company.id, company_name: company.name, company_email: company.email }

  if (!accountHolder) {
    return { ...companyInfo, account_holder: null }
  }

  return { ...companyInfo, account_holder: accountHolder }
}

export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { account_holder } = await getCompanyAccountHolder(req)

  if (!account_holder) {
    res.json({ payment_methods: [] })
    return
  }

  const accountHolderId = account_holder.data?.id
  if (!accountHolderId) {
    res.json({ payment_methods: [] })
    return
  }

  const queryProvider = (req.query as Record<string, unknown>)?.provider_id as string | undefined

  // Validate provider_id
  // 1. Rejeitar provider desconhecido/arbitrário
  // 2. Garantir que bate com o configurado (ex: pp_stripe_stripe) ou o vinculado ao account_holder
  const allowedProvider = account_holder.provider_id || "pp_stripe_stripe"

  if (queryProvider && queryProvider !== allowedProvider) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid provider_id requested or mismatch with account holder"
    )
  }

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as unknown as {
    listPaymentMethods: (filter: { provider_id?: string; context?: Record<string, unknown> }) => Promise<unknown[]>
  }

  const paymentMethods = await paymentModuleService.listPaymentMethods({
    provider_id: allowedProvider,
    context: {
      account_holder: {
        data: { id: accountHolderId },
      },
    },
  })

  res.json({ payment_methods: paymentMethods })
}

export async function POST(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  let { company_id, company_name, company_email, account_holder } =
    await getCompanyAccountHolder(req)

  if (!account_holder) {
    if (!isStripeConfigured()) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Saved payment methods are not available. Stripe is not configured."
      )
    }

    const { result } = await createCompanyAccountHolderWorkflow(req.scope).run({
      input: {
        company_id,
        company_name,
        company_email,
        provider_id: "pp_stripe_stripe",
      },
    })

    account_holder = result as unknown as QueryAccountHolder
  }

  const stripeCustomerId = account_holder.data?.id
  if (!stripeCustomerId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No Stripe customer found for this company"
    )
  }

  if (!process.env.STRIPE_API_KEY) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Stripe is not configured. Cannot create setup intent."
    )
  }

  const Stripe = require("stripe").default || require("stripe")
  const stripe = new Stripe(process.env.STRIPE_API_KEY)

  const setupIntent = await stripe.setupIntents.create({
    [Modules.CUSTOMER]: stripeCustomerId,
    payment_method_types: ["card"],
  })

  res.json({ client_secret: setupIntent.client_secret })
}
