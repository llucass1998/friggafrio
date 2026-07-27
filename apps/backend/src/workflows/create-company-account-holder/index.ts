import {
  createWorkflow,
  createStep,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { Modules, ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { COMPANY_MODULE } from "../../modules/company"
import type { IPaymentModuleService } from "@medusajs/framework/types"

type CreateCompanyAccountHolderInput = {
  company_id: string
  company_name: string
  company_email: string
  provider_id: string
}

const createAccountHolderStep = createStep(
  "create-account-holder",
  async (input: CreateCompanyAccountHolderInput, { container }) => {
    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)

    const accountHolder = await paymentModuleService.createAccountHolder({
      provider_id: input.provider_id,
      context: {
        customer: {
          id: input.company_id,
          email: input.company_email,
        },
      },
    })

    return new StepResponse(accountHolder, {
      account_holder_id: accountHolder.id,
    })
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    const paymentModuleService: IPaymentModuleService =
      container.resolve(Modules.PAYMENT)
    await paymentModuleService.deleteAccountHolder(
      compensationData.account_holder_id
    )
  }
)

const linkAccountHolderToCompanyStep = createStep(
  "link-account-holder-to-company",
  async (
    input: { company_id: string; account_holder_id: string },
    { container }
  ) => {
    // @ts-expect-error
    const link = container.resolve(ContainerRegistrationKeys.LINK) as import("@medusajs/types").ILinkModule

    await link.create({
      // @ts-expect-error
      [COMPANY_MODULE]: { company_id: input.company_id },
      [Modules.PAYMENT]: { account_holder_id: input.account_holder_id },
    })

    return new StepResponse(undefined, input)
  },
  async (compensationData, { container }) => {
    if (!compensationData) return
    // @ts-expect-error
    const link = container.resolve(ContainerRegistrationKeys.LINK) as import("@medusajs/types").ILinkModule
    await link.dismiss({
      // @ts-expect-error
      [COMPANY_MODULE]: { company_id: compensationData.company_id },
      [Modules.PAYMENT]: {
        account_holder_id: compensationData.account_holder_id,
      },
    })
  }
)

export const createCompanyAccountHolderWorkflow = createWorkflow(
  "create-company-account-holder",
  function (input: CreateCompanyAccountHolderInput) {
    const accountHolder = createAccountHolderStep(input)

    linkAccountHolderToCompanyStep({
      company_id: input.company_id,
      account_holder_id: accountHolder.id,
    })

    return new WorkflowResponse(accountHolder)
  }
)
