import { model } from "@medusajs/framework/utils";

export const AuditLog = model
  .define("audit_log", {
    id: model.id().primaryKey(),
    actor: model.text().nullable(),
    actor_type: model
      .enum(["customer", "admin", "system", "employee"])
      .default("system"),
    action: model.text(),
    resource: model.text(),
    resource_id: model.text().nullable(),
    result: model.enum(["success", "failure"]).default("success"),
    ip_anonymized: model.text().nullable(),
    user_agent_short: model.text().nullable(),
    correlation_id: model.text().nullable(),
    before_state: model.json().nullable(),
    after_state: model.json().nullable(),
  })
  .indexes([
    {
      name: "IDX_audit_log_resource",
      on: ["resource", "resource_id"],
    },
    {
      name: "IDX_audit_log_action",
      on: ["action"],
    },
    {
      name: "IDX_audit_log_correlation_id",
      on: ["correlation_id"],
      where: '"deleted_at" IS NULL AND "correlation_id" IS NOT NULL',
    },
  ]);
