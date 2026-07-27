import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { COMPANY_MODULE } from "../../modules/company"
import CompanyModuleService from "../../modules/company/service"
import { MedusaError } from "@medusajs/framework/utils"

export type DeleteCompanyInput = {
  id: string
}

export function isDeleteCompanyInput(value: unknown): value is DeleteCompanyInput {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const record = value as Record<string, unknown>

  return typeof record.id === "string" && record.id.trim().length > 0
}

export async function deleteCompanyStepHandler(input: DeleteCompanyInput, { container }: { container: any }) {
  if (!isDeleteCompanyInput(input)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Invalid input for deleteCompanyStep: 'id' must be a non-empty string"
    )
  }

  const companyModuleService: CompanyModuleService =
    container.resolve(COMPANY_MODULE)

  await companyModuleService.softDeleteCompanies(input.id)

  return new StepResponse(undefined, input.id)
}

export async function deleteCompanyCompensationHandler(id: unknown, { container }: { container: any }) {
  if (!id || typeof id !== "string" || id.trim().length === 0) return

  const companyModuleService: CompanyModuleService =
    container.resolve(COMPANY_MODULE)

  await companyModuleService.restoreCompanies(id)
}

const deleteCompanyStep = createStep<DeleteCompanyInput, undefined, unknown>(
  "delete-company",
  deleteCompanyStepHandler,
  deleteCompanyCompensationHandler
)

export const deleteCompanyWorkflow = createWorkflow(
  "delete-company",
  (input: DeleteCompanyInput) => {
    deleteCompanyStep(input)

    return new WorkflowResponse(undefined)
  }
)
