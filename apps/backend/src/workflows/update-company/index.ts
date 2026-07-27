import {
  createWorkflow,
  WorkflowResponse,
  when,
  transform,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../modules/company"
import CompanyModuleService from "../../modules/company/service"
import {
  CompanyStatus,
  SpendLimitResetFrequency,
} from "../../modules/company/models"
import type { IPaymentModuleService, MedusaContainer } from "@medusajs/framework/types"
import { isStripeConfigured } from "../../utils/is-stripe-configured"
import { MedusaError } from "@medusajs/framework/utils"

export type UpdateCompanyInput = {
  id: string
  name?: string
  email?: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  postal_code?: string | null
  country_code?: string | null
  logo_url?: string | null
  status?: CompanyStatus
  spend_limit_reset_frequency?: SpendLimitResetFrequency
}

export type UpdateCompanyStepResult = {
  id: string
  name: string
  email: string
  status: string
  previous_status: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country_code: string | null
  logo_url: string | null
  spend_limit_reset_frequency: SpendLimitResetFrequency | undefined
}

export type UpdateCompanyCompensationData = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country_code: string | null
  logo_url: string | null
  status: CompanyStatus
  spend_limit_reset_frequency: SpendLimitResetFrequency | undefined
}

export type WorkflowHandlerContext = {
  container: MedusaContainer
}

export function isUpdateCompanyInput(value: unknown): value is UpdateCompanyInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const record = value as Record<string, unknown>

  if (typeof record.id !== "string" || record.id.trim().length === 0) {
    return false
  }

  const validateOptionalString = (val: unknown) => typeof val === "string" || val === undefined
  const validateNullableString = (val: unknown) => typeof val === "string" || val === null || val === undefined

  if (!validateOptionalString(record.name)) return false
  if (!validateOptionalString(record.email)) return false
  if (!validateNullableString(record.phone)) return false
  if (!validateNullableString(record.address)) return false
  if (!validateNullableString(record.city)) return false
  if (!validateNullableString(record.state)) return false
  if (!validateNullableString(record.postal_code)) return false
  if (!validateNullableString(record.country_code)) return false
  if (!validateNullableString(record.logo_url)) return false

  if (
    record.status !== undefined &&
    record.status !== CompanyStatus.ACTIVE &&
    record.status !== CompanyStatus.INACTIVE &&
    record.status !== CompanyStatus.PENDING &&
    record.status !== CompanyStatus.SUSPENDED
  ) {
    return false
  }

  if (
    record.spend_limit_reset_frequency !== undefined &&
    record.spend_limit_reset_frequency !== SpendLimitResetFrequency.NONE &&
    record.spend_limit_reset_frequency !== SpendLimitResetFrequency.DAILY &&
    record.spend_limit_reset_frequency !== SpendLimitResetFrequency.WEEKLY &&
    record.spend_limit_reset_frequency !== SpendLimitResetFrequency.MONTHLY &&
    record.spend_limit_reset_frequency !== SpendLimitResetFrequency.YEARLY
  ) {
    return false
  }

  return true
}

export function isUpdateCompanyCompensationData(value: unknown): value is UpdateCompanyCompensationData {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false
  const r = value as Record<string, unknown>

  if (typeof r.id !== "string") return false
  if (typeof r.name !== "string") return false
  if (typeof r.email !== "string") return false

  if (
    r.status !== CompanyStatus.ACTIVE &&
    r.status !== CompanyStatus.INACTIVE &&
    r.status !== CompanyStatus.PENDING &&
    r.status !== CompanyStatus.SUSPENDED
  ) return false

  return true
}

export async function updateCompanyStepHandler(
  input: unknown,
  { container }: WorkflowHandlerContext
) {
  if (!isUpdateCompanyInput(input)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid input for updateCompanyStep"
    )
  }

  const companyModuleService = container.resolve<CompanyModuleService>(COMPANY_MODULE)

  const { id, ...data } = input
  const normalizedId = id.trim()

  const previousCompany = await companyModuleService.retrieveCompany(normalizedId)

  const compensationData: UpdateCompanyCompensationData = {
    id: previousCompany.id,
    name: previousCompany.name,
    email: previousCompany.email,
    phone: previousCompany.phone,
    address: previousCompany.address,
    city: previousCompany.city,
    state: previousCompany.state,
    postal_code: previousCompany.postal_code,
    country_code: previousCompany.country_code,
    logo_url: previousCompany.logo_url,
    status: previousCompany.status as CompanyStatus,
    spend_limit_reset_frequency: (previousCompany.spend_limit_reset_frequency ?? undefined) as SpendLimitResetFrequency | undefined,
  }

  const company = await companyModuleService.updateCompanies({
    id: normalizedId,
    ...data,
  })

  const stepResult: UpdateCompanyStepResult = {
    id: company.id,
    name: company.name,
    email: company.email,
    status: company.status as string,
    previous_status: previousCompany.status as string,
    phone: company.phone,
    address: company.address,
    city: company.city,
    state: company.state,
    postal_code: company.postal_code,
    country_code: company.country_code,
    logo_url: company.logo_url,
    spend_limit_reset_frequency: (company.spend_limit_reset_frequency ?? undefined) as SpendLimitResetFrequency | undefined,
  }

  return new StepResponse(stepResult, compensationData)
}

export async function updateCompanyCompensationHandler(
  compensationData: unknown,
  { container }: WorkflowHandlerContext
) {
  if (!isUpdateCompanyCompensationData(compensationData)) {
    return
  }

  const companyModuleService = container.resolve<CompanyModuleService>(COMPANY_MODULE)

  await companyModuleService.updateCompanies({
    id: compensationData.id,
    name: compensationData.name,
    email: compensationData.email,
    phone: compensationData.phone,
    address: compensationData.address,
    city: compensationData.city,
    state: compensationData.state,
    postal_code: compensationData.postal_code,
    country_code: compensationData.country_code,
    logo_url: compensationData.logo_url,
    status: compensationData.status,
    spend_limit_reset_frequency: compensationData.spend_limit_reset_frequency,
  })
}

async function updateCompanyStepWrapper(input: UpdateCompanyInput, context: WorkflowHandlerContext) {
  return await updateCompanyStepHandler(input, context)
}

const updateCompanyStep = createStep<UpdateCompanyInput, UpdateCompanyStepResult, unknown>(
  "update-company",
  updateCompanyStepWrapper,
  updateCompanyCompensationHandler
)

const createAccountHolderStep = createStep(
  "create-account-holder",
  async (
    input: { company_id: string; company_email: string },
    { container }
  ) => {
    if (!isStripeConfigured()) {
      return new StepResponse({ skipped: true }, null)
    }

    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)
    const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

    const { data: existingLinks } = await query.graph({
      entity: "company",
      fields: ["account_holder.*"],
      filters: { id: input.company_id },
    })

    const existingAccountHolder = (existingLinks[0] as any)?.account_holder
    if (existingAccountHolder) {
      return new StepResponse({ skipped: true }, null)
    }

    const accountHolder = await paymentModuleService.createAccountHolder({
      provider_id: "pp_stripe_stripe",
      context: {
        customer: {
          id: input.company_id,
          email: input.company_email,
        },
      },
    })

    const link = container.resolve(ContainerRegistrationKeys.LINK) as any
    await link.create({
      [COMPANY_MODULE]: { company_id: input.company_id },
      [Modules.PAYMENT]: { account_holder_id: accountHolder.id },
    })

    return new StepResponse(
      { skipped: false, account_holder_id: accountHolder.id },
      { company_id: input.company_id, account_holder_id: accountHolder.id }
    )
  },
  async (compensationData: any, { container }) => {
    if (!compensationData) return
    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)
    const link = container.resolve(ContainerRegistrationKeys.LINK) as any

    await link.dismiss({
      [COMPANY_MODULE]: { company_id: compensationData.company_id },
      [Modules.PAYMENT]: {
        account_holder_id: compensationData.account_holder_id,
      },
    })
    await paymentModuleService.deleteAccountHolder(
      compensationData.account_holder_id
    )
  }
)

export const updateCompanyWorkflow = createWorkflow(
  "update-company",
  function (input: UpdateCompanyInput) {
    const company = updateCompanyStep(input)

    const activationData = transform({ company }, ({ company }) => ({
      company_id: company.id,
      company_email: company.email,
      was_activated:
        company.status === "active" &&
        company.previous_status !== "active",
    }))

    when(activationData, ({ was_activated }) => was_activated).then(() => {
      createAccountHolderStep({
        company_id: activationData.company_id,
        company_email: activationData.company_email,
      })
    })

    return new WorkflowResponse(company)
  }
)
