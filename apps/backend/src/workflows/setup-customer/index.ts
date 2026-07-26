import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createCustomerAccountWorkflow } from "@medusajs/medusa/core-flows";
import { MedusaError, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import type { IAuthModuleService } from "@medusajs/types";

export type SetupCustomerInput = {
  // Auth credentials
  email: string;
  password: string;
  // Customer data
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, unknown>;
};

/**
 * Step 1: Register auth identity with emailpass provider
 */
const registerAuthIdentityStep = createStep(
  "register-customer-auth-identity",
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
        error || "Unable to register the customer.",
      );
    }

    return new StepResponse(authIdentity, authIdentity.id);
  },
  async (authIdentityId, { container }) => {
    if (!authIdentityId) return;

    const authModuleService = container.resolve<IAuthModuleService>(
      Modules.AUTH,
    );
    await authModuleService.deleteAuthIdentities([authIdentityId]);
  },
);

/**
 * Setup Customer Workflow
 */
export const setupCustomerWorkflow = createWorkflow(
  "setup-customer",
  function (input: SetupCustomerInput) {
    // Step 1: Register auth identity
    const authIdentity = registerAuthIdentityStep({
      email: input.email,
      password: input.password,
    });

    // Step 2: Create customer linked to auth identity
    const customerResult = createCustomerAccountWorkflow.runAsStep({
      input: {
        authIdentityId: authIdentity.id,
        customerData: {
          email: input.email,
          first_name: input.first_name,
          last_name: input.last_name,
          phone: input.phone,
          metadata: input.metadata,
        },
      },
    });

    return new WorkflowResponse({
      authIdentity,
      customer: customerResult,
    });
  },
);
