import {
  createWorkflow,
  WorkflowResponse,
  createStep,
  StepResponse
} from "@medusajs/framework/workflows-sdk"
import { COMPANY_MODULE } from "../../modules/company"
import type CompanyModuleService from "../../modules/company/service"
import { MedusaError } from "@medusajs/framework/utils"
import type { MedusaContainer } from "@medusajs/framework/types"

export type DeleteCompanyInput = {
  id: string
}

type WorkflowHandlerContext = {
  container: MedusaContainer
}

export function isDeleteCompanyInput(value: unknown): value is DeleteCompanyInput {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === "string" && record.id.trim().length > 0
}

export async function deleteCompanyStepHandler(
  input: unknown,
  { container }: WorkflowHandlerContext
) {
  if (!isDeleteCompanyInput(input)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid input for deleteCompanyStep: 'id' must be a non-empty string"
    )
  }

  const id = input.id.trim()

  const companyModuleService = container.resolve<CompanyModuleService>(COMPANY_MODULE)

  await companyModuleService.softDeleteCompanies(id)

  return new StepResponse(undefined, id)
}

export async function deleteCompanyCompensationHandler(
  id: unknown,
  { container }: WorkflowHandlerContext
) {
  if (typeof id !== "string" || id.trim().length === 0) {
    return
  }

  const companyModuleService = container.resolve<CompanyModuleService>(COMPANY_MODULE)

  await companyModuleService.restoreCompanies(id.trim())
}

// Wrapper to satisfy SDK signature while avoiding "any" or casts.
async function deleteCompanyStepWrapper(
  input: DeleteCompanyInput,
  context: WorkflowHandlerContext
) {
  return await deleteCompanyStepHandler(input, context)
}

const deleteCompanyStep = createStep<DeleteCompanyInput, undefined, unknown>(
  "delete-company",
  deleteCompanyStepWrapper,
  deleteCompanyCompensationHandler
)

export const deleteCompanyWorkflow = createWorkflow(
  "delete-company",
  (input: DeleteCompanyInput) => {
    deleteCompanyStep(input)

    return new WorkflowResponse(undefined)
  }
)
