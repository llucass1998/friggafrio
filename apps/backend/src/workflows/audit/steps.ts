import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { AUDIT_LOG_MODULE } from "../../modules/audit-log";
import type AuditLogService from "../../modules/audit-log/service";

export const createAuditLogStep = createStep(
  "create-audit-log",
  async (
    input: {
      resource_id?: string;
      resource: string;
      action: string;
      actor?: string;
      actor_type?: "customer" | "admin" | "system" | "employee";
      result?: "success" | "failure";
      correlation_id?: string;
      before_state?: Record<string, unknown>;
      after_state?: Record<string, unknown>;
    },
    { container },
  ) => {
    const auditLogModule = container.resolve<AuditLogService>(AUDIT_LOG_MODULE);

    const log = await auditLogModule.createAuditLogs({
      resource_id: input.resource_id,
      resource: input.resource,
      action: input.action,
      actor: input.actor,
      actor_type: input.actor_type ?? "system",
      result: input.result ?? "success",
      correlation_id: input.correlation_id,
      before_state: input.before_state,
      after_state: input.after_state,
    });

    return new StepResponse(log, log.id);
  },
  async () => {
    // Audit records are immutable and intentionally survive workflow compensation.
  },
);
