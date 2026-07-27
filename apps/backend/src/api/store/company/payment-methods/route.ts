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

// Interfaces for Medusa Graph Query results
interface QueryCompany {
  id: string
  name: string
  email: string
}

interface QueryEmployee {
  is_admin: boolean
  company?: QueryCompany
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

// Type Guards to safely replace 'as unknown as' assertions
function isQueryCustomer(data: unknown): data is QueryCustomer {
  return typeof data === "object" && data !== null && "id" in data
}

function isQueryCompanyWithHolder(data: unknown): data is QueryCompanyWithHolder {
  return typeof data === "object" && data !== null && "id" in data
}

function isWorkflowResultWithDataId(data: unknown): data is QueryAccountHolder {
  if (typeof data !== "object" || data === null) return false
  const holder = data as Record<string, unknown>
  return typeof holder.id === "string"
}

// Adapter para o PaymentModuleService.
// Como @medusajs não exporta IPaymentModuleService globalmente no contexto atual de rotas de loja,
// usamos este adapter local mínimo validado pelo ecossistema para interagir com o container.
interface PaymentModuleServiceAdapter {
  listPaymentMethods: (filter: { provider_id?: string; context?: Record<string, unknown> }) => Promise<unknown[]>
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

  if (!Array.isArray(customers) || customers.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found")
  }

  const customerRecord = customers[0]
  if (!isQueryCustomer(customerRecord)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid customer data structure")
  }

  const employee = customerRecord.employee
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

  if (!Array.isArray(companies) || companies.length === 0) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Company not found in graph")
  }

  const companyRecord = companies[0]
  if (!isQueryCompanyWithHolder(companyRecord)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid company data structure")
  }

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
  const providerId = account_holder.provider_id

  // Enforce fail-closed if the account holder doesn't have a configured provider_id
  if (!accountHolderId || !providerId) {
    res.json({ payment_methods: [] })
    return
  }

  // A leitura arbitrária de req.query.provider_id foi completamente removida.
  // O sistema utiliza unicamente o provider validado atrelado ao account_holder no banco.

  const paymentModuleService = req.scope.resolve(Modules.PAYMENT) as unknown as PaymentModuleServiceAdapter

  const paymentMethods = await paymentModuleService.listPaymentMethods({
    provider_id: providerId,
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

    if (!isWorkflowResultWithDataId(result)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Workflow returned an invalid account holder structure")
    }

    account_holder = result
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
