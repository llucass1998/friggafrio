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
  status: CompanyStatus
  previous_status: CompanyStatus
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country_code: string | null
  logo_url: string | null
  spend_limit_reset_frequency: SpendLimitResetFrequency
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
  spend_limit_reset_frequency: SpendLimitResetFrequency
}

export type WorkflowHandlerContext = {
  container: MedusaContainer
}

export function isCompanyStatus(value: unknown): value is CompanyStatus {
  return (
    value === CompanyStatus.ACTIVE ||
    value === CompanyStatus.INACTIVE ||
    value === CompanyStatus.PENDING ||
    value === CompanyStatus.SUSPENDED
  )
}

export function isSpendLimitResetFrequency(value: unknown): value is SpendLimitResetFrequency {
  return (
    value === SpendLimitResetFrequency.NONE ||
    value === SpendLimitResetFrequency.DAILY ||
    value === SpendLimitResetFrequency.WEEKLY ||
    value === SpendLimitResetFrequency.MONTHLY ||
    value === SpendLimitResetFrequency.YEARLY
  )
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

export function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null
}

function isUnknownObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function isUpdateCompanyInput(value: unknown): value is UpdateCompanyInput {
  if (!isUnknownObject(value)) return false

  if (!isNonEmptyString(value.id)) return false

  if (value.name !== undefined && typeof value.name !== "string") return false
  if (value.email !== undefined && typeof value.email !== "string") return false
  if (value.phone !== undefined && !isNullableString(value.phone)) return false
  if (value.address !== undefined && !isNullableString(value.address)) return false
  if (value.city !== undefined && !isNullableString(value.city)) return false
  if (value.state !== undefined && !isNullableString(value.state)) return false
  if (value.postal_code !== undefined && !isNullableString(value.postal_code)) return false
  if (value.country_code !== undefined && !isNullableString(value.country_code)) return false
  if (value.logo_url !== undefined && !isNullableString(value.logo_url)) return false

  if (value.status !== undefined && !isCompanyStatus(value.status)) return false
  if (value.spend_limit_reset_frequency !== undefined && !isSpendLimitResetFrequency(value.spend_limit_reset_frequency)) return false

  return true
}

export function isUpdateCompanyCompensationData(value: unknown): value is UpdateCompanyCompensationData {
  if (!isUnknownObject(value)) return false

  if (!isNonEmptyString(value.id)) return false
  if (typeof value.name !== "string") return false
  if (typeof value.email !== "string") return false

  if (!isNullableString(value.phone)) return false
  if (!isNullableString(value.address)) return false
  if (!isNullableString(value.city)) return false
  if (!isNullableString(value.state)) return false
  if (!isNullableString(value.postal_code)) return false
  if (!isNullableString(value.country_code)) return false
  if (!isNullableString(value.logo_url)) return false

  if (!isCompanyStatus(value.status)) return false

  if (!Object.prototype.hasOwnProperty.call(value, "spend_limit_reset_frequency")) return false
  if (!isSpendLimitResetFrequency(value.spend_limit_reset_frequency)) return false

  return true
}


export type CreateAccountHolderInput = {
  company_id: string
  company_email: string
}

export type CreateAccountHolderStepResult =
  | { skipped: true }
  | { skipped: false; account_holder_id: string }

export type CreateAccountHolderCompensationData = {
  company_id: string
  account_holder_id: string
}

export function isCreateAccountHolderInput(value: unknown): value is CreateAccountHolderInput {
  if (!isUnknownObject(value)) return false
  if (!isNonEmptyString(value.company_id)) return false
  if (!isNonEmptyString(value.company_email)) return false

  const trimmedEmail = value.company_email.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) return false

  return true
}

export function buildCreateAccountHolderInput(value: unknown): CreateAccountHolderInput {
  if (!isCreateAccountHolderInput(value)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid input for createAccountHolderStep")
  }
  return {
    company_id: value.company_id.trim(),
    company_email: value.company_email.trim().toLowerCase(),
  }
}

export function isCreateAccountHolderCompensationData(value: unknown): value is CreateAccountHolderCompensationData {
  if (!isUnknownObject(value)) return false
  if (!isNonEmptyString(value.company_id)) return false
  if (!isNonEmptyString(value.account_holder_id)) return false
  return true
}

export function buildCreateAccountHolderCompensationData(value: unknown): CreateAccountHolderCompensationData {
  if (!isCreateAccountHolderCompensationData(value)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid compensation data for createAccountHolderStep")
  }
  return {
    company_id: value.company_id.trim(),
    account_holder_id: value.account_holder_id.trim(),
  }
}

export async function createAccountHolderStepHandler(
  input: unknown,
  { container }: WorkflowHandlerContext
) {
  const payload = buildCreateAccountHolderInput(input)

  if (!isStripeConfigured()) {
    return new StepResponse<CreateAccountHolderStepResult, null>({ skipped: true }, null)
  }

  const paymentModuleService: IPaymentModuleService = container.resolve(Modules.PAYMENT)
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: existingLinks } = await query.graph({
    entity: "company",
    fields: ["account_holder.*"],
    filters: { id: payload.company_id },
  })

  const existingAccountHolder = (existingLinks[0] as any)?.account_holder
  if (existingAccountHolder) {
    return new StepResponse<CreateAccountHolderStepResult, null>({ skipped: true }, null)
  }

  const accountHolder = await paymentModuleService.createAccountHolder({
    provider_id: "pp_stripe_stripe",
    context: {
      customer: {
        id: payload.company_id,
        email: payload.company_email,
      },
    },
  })

  const link = container.resolve(ContainerRegistrationKeys.LINK) as any
  await link.create({
    [COMPANY_MODULE]: { company_id: payload.company_id },
    [Modules.PAYMENT]: { account_holder_id: accountHolder.id },
  })

  const compensateInput = buildCreateAccountHolderCompensationData({
    company_id: payload.company_id,
    account_holder_id: accountHolder.id
  })

  return new StepResponse<CreateAccountHolderStepResult, CreateAccountHolderCompensationData>({ skipped: false, account_holder_id: accountHolder.id }, compensateInput)
}

export async function createAccountHolderCompensationHandler(
  compensationData: unknown,
  { container }: WorkflowHandlerContext
) {
  if (!isCreateAccountHolderCompensationData(compensationData)) {
    return
  }
  const payload = buildCreateAccountHolderCompensationData(compensationData)

  const paymentModuleService: IPaymentModuleService = container.resolve(Modules.PAYMENT)
  const link = container.resolve(ContainerRegistrationKeys.LINK) as any

  await link.dismiss({
    [COMPANY_MODULE]: { company_id: payload.company_id },
    [Modules.PAYMENT]: {
      account_holder_id: payload.account_holder_id,
    },
  })

  await paymentModuleService.deleteAccountHolder(payload.account_holder_id)
}


export function buildUpdateCompanyPayload(input: UpdateCompanyInput): UpdateCompanyInput {
  const payload: UpdateCompanyInput = {
    id: input.id.trim(),
  }

  if (input.name !== undefined) payload.name = input.name
  if (input.email !== undefined) payload.email = input.email
  if (input.phone !== undefined) payload.phone = input.phone
  if (input.address !== undefined) payload.address = input.address
  if (input.city !== undefined) payload.city = input.city
  if (input.state !== undefined) payload.state = input.state
  if (input.postal_code !== undefined) payload.postal_code = input.postal_code
  if (input.country_code !== undefined) payload.country_code = input.country_code
  if (input.logo_url !== undefined) payload.logo_url = input.logo_url
  if (input.status !== undefined) payload.status = input.status
  if (input.spend_limit_reset_frequency !== undefined) payload.spend_limit_reset_frequency = input.spend_limit_reset_frequency

  return payload
}

export function buildUpdateCompanyCompensationData(value: unknown): UpdateCompanyCompensationData {
  if (!isUpdateCompanyCompensationData(value)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Service returned invalid company data for snapshot")
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    phone: value.phone,
    address: value.address,
    city: value.city,
    state: value.state,
    postal_code: value.postal_code,
    country_code: value.country_code,
    logo_url: value.logo_url,
    status: value.status,
    spend_limit_reset_frequency: value.spend_limit_reset_frequency,
  }
}

export function buildUpdateCompanyStepResult(value: unknown, previousStatus: unknown): UpdateCompanyStepResult {
  // A StepResult contains the same fields as the CompensationData plus the previous_status
  if (!isUpdateCompanyCompensationData(value)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Service returned invalid company data for step result")
  }

  if (!isCompanyStatus(previousStatus)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid previous status")
  }

  return {
    id: value.id,
    name: value.name,
    email: value.email,
    status: value.status,
    previous_status: previousStatus,
    phone: value.phone,
    address: value.address,
    city: value.city,
    state: value.state,
    postal_code: value.postal_code,
    country_code: value.country_code,
    logo_url: value.logo_url,
    spend_limit_reset_frequency: value.spend_limit_reset_frequency,
  }
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

  const payload = buildUpdateCompanyPayload(input)
  const previousCompanyRaw = await companyModuleService.retrieveCompany(payload.id)

  const compensationData = buildUpdateCompanyCompensationData(previousCompanyRaw)
  const previousStatus = compensationData.status

  const companyRaw = await companyModuleService.updateCompanies(payload)
  const stepResult = buildUpdateCompanyStepResult(companyRaw, previousStatus)

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
  const payload = buildUpdateCompanyPayload(compensationData)

  await companyModuleService.updateCompanies(payload)
}

async function updateCompanyStepWrapper(input: UpdateCompanyInput, context: WorkflowHandlerContext) {
  return await updateCompanyStepHandler(input, context)
}

const updateCompanyStep = createStep<UpdateCompanyInput, UpdateCompanyStepResult, unknown>(
  "update-company",
  updateCompanyStepWrapper,
  updateCompanyCompensationHandler
)

async function createAccountHolderStepWrapper(input: CreateAccountHolderInput, context: WorkflowHandlerContext) {
  return await createAccountHolderStepHandler(input, context)
}

const createAccountHolderStep = createStep<
  CreateAccountHolderInput,
  CreateAccountHolderStepResult,
  CreateAccountHolderCompensationData | null
>(
  "create-account-holder",
  createAccountHolderStepWrapper,
  createAccountHolderCompensationHandler
)

export const updateCompanyWorkflow = createWorkflow(
  "update-company",
  function (input: UpdateCompanyInput) {
    const company = updateCompanyStep(input)

    const activationData = transform({ company }, ({ company }) => ({
      company_id: company.id,
      company_email: company.email,
      was_activated:
        company.status === CompanyStatus.ACTIVE &&
        company.previous_status !== CompanyStatus.ACTIVE,
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
