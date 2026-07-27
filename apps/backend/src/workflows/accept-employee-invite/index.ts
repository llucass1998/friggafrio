import {
  createStep,
  StepResponse,
  createWorkflow,
  WorkflowResponse,
  transform,
} from "@medusajs/framework/workflows-sdk";
import {
  createCustomerAccountWorkflow,
  createLinksWorkflow,
  validateTokenStep,
  deleteInvitesWorkflow,
} from "@medusajs/medusa/core-flows";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import type { IAuthModuleService } from "@medusajs/framework/types";
import { COMPANY_MODULE } from "../../modules/company";
import CompanyModuleService from "../../modules/company/service";

type AcceptEmployeeInviteInput = {
  token: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
};

// Step to validate the employee invite metadata
const validateEmployeeInviteMetadataStep = createStep(
  "validate-employee-invite-metadata",
  async (input: {
    invite: {
      id: string;
      email: string;
      metadata: Record<string, unknown> | null;
    };
  }) => {
    const metadata = input.invite.metadata as {
      type?: string;
      company_id?: string;
      spending_limit?: number | null;
      is_admin?: boolean;
    } | null;

    if (metadata?.type !== "employee_invite" || !metadata?.company_id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Invalid invite type - this is not an employee invite",
      );
    }

    return new StepResponse({
      invite_id: input.invite.id,
      email: input.invite.email,
      company_id: metadata.company_id,
      spending_limit: metadata.spending_limit ?? null,
      is_admin: metadata.is_admin ?? false,
    });
  },
);

const createEmployeeStep = createStep(
  "create-employee",
  async (
    input: {
      company_id: string;
      spending_limit: number | null;
      is_admin: boolean;
    },
    { container },
  ) => {
    const companyService = container.resolve(
      COMPANY_MODULE,
    ) as CompanyModuleService;

    const employee = await companyService.createEmployees({
      company_id: input.company_id,
      is_admin: input.is_admin,
      spending_limit: input.spending_limit,
    });

    return new StepResponse(employee, employee.id);
  },
  async (employeeId, { container }) => {
    if (!employeeId) return;

    const companyService = container.resolve(
      COMPANY_MODULE,
    ) as CompanyModuleService;
    await companyService.deleteEmployees(employeeId);
  },
);

const registerEmployeeAuthIdentityStep = createStep(
  "register-employee-auth-identity",
  async (input: { email: string; password: string }, { container }) => {
    const authModuleService = container.resolve<IAuthModuleService>(
      Modules.AUTH,
    );
    const { success, authIdentity, error } = await authModuleService.register(
      "emailpass",
      {
        body: {
          email: input.email,
          password: input.password,
        },
      },
    );

    if (!success || error || !authIdentity) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        error || "Unable to register the invited employee.",
      );
    }

    return new StepResponse(authIdentity, authIdentity.id);
  },
  async (authIdentityId, { container }) => {
    if (!authIdentityId) {
      return;
    }

    const authModuleService = container.resolve<IAuthModuleService>(
      Modules.AUTH,
    );
    await authModuleService.deleteAuthIdentities([authIdentityId]);
  },
);

export const acceptEmployeeInviteWorkflow = createWorkflow(
  "accept-employee-invite",
  function (input: AcceptEmployeeInviteInput) {
    // Step 1: Validate the invite token using core step
    const invite = validateTokenStep(input.token);

    // Step 2: Validate employee invite metadata
    const metadataInput = transform({ invite }, ({ invite }) => ({ invite }));
    const inviteData = validateEmployeeInviteMetadataStep(metadataInput);

    // Step 3: Register the email/password identity inside the atomic workflow.
    const authIdentityInput = transform(
      { inviteData, input },
      ({ inviteData, input }) => ({
        email: inviteData.email,
        password: input.password,
      }),
    );
    const authIdentity = registerEmployeeAuthIdentityStep(authIdentityInput);

    // Step 4: Create the customer account and link auth identity.
    // createCustomerAccountWorkflow handles both:
    // - Creating customer with has_account: true
    // - Setting auth identity app_metadata with customer_id
    const customerAccountInput = transform(
      { inviteData, input, authIdentity },
      ({ inviteData, input, authIdentity }) => ({
        authIdentityId: authIdentity.id,
        customerData: {
          email: inviteData.email,
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
        },
      }),
    );

    const customer = createCustomerAccountWorkflow.runAsStep({
      input: customerAccountInput,
    });

    const employeeInput = transform({ inviteData }, ({ inviteData }) => ({
      company_id: inviteData.company_id,
      spending_limit: inviteData.spending_limit,
      is_admin: inviteData.is_admin,
    }));

    const employee = createEmployeeStep(employeeInput);

    // Step 6: Link employee to customer
    const linkInput = transform(
      { employee, customer },
      ({ employee, customer }) => [
        {
          [COMPANY_MODULE]: {
            employee_id: employee.id,
          },
          [Modules.CUSTOMER]: {
            customer_id: customer.id,
          },
        },
      ],
    );

    createLinksWorkflow.runAsStep({
      input: linkInput,
    });

    // Step 7: Delete the invite after successful acceptance
    const deleteInviteInput = transform({ inviteData }, ({ inviteData }) => ({
      ids: [inviteData.invite_id],
    }));

    deleteInvitesWorkflow.runAsStep({
      input: deleteInviteInput,
    });

    // Return the result
    const result = transform(
      { employee, customer, inviteData },
      ({ employee, customer, inviteData }) => ({
        employee,
        customer,
        company_id: inviteData.company_id,
        is_admin: inviteData.is_admin,
        spending_limit: inviteData.spending_limit,
      }),
    );

    return new WorkflowResponse(result);
  },
);

export default acceptEmployeeInviteWorkflow;
