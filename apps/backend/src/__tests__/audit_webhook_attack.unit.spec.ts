import { AuditLog } from "../modules/audit-log/models/audit-log";
import { CustomerProfile } from "../modules/customer-profile/models/customer-profile";
import { PaymentAttempt } from "../modules/payment-attempt/models/payment-attempt";
import { PaymentWebhookEvent } from "../modules/payment-webhook-event/models/payment-webhook-event";

const indexNames = (modelDefinition: {
  parse: () => { indexes: Array<{ name?: string }> };
}) => modelDefinition.parse().indexes.map((index) => index.name);

const checkNames = (modelDefinition: {
  parse: () => {
    checks: Array<{ name?: string } | ((...args: never[]) => string)>;
  };
}) =>
  modelDefinition
    .parse()
    .checks.flatMap((check) =>
      typeof check === "function" || !check.name ? [] : [check.name],
    );

describe("persistence constraints for sensitive workflows", () => {
  it("defines unique idempotency indexes for payment attempts", () => {
    expect(indexNames(PaymentAttempt)).toEqual(
      expect.arrayContaining(["IDX_payment_attempt_provider_payment"]),
    );
    const idempotencyMetadata =
      PaymentAttempt.parse().schema.idempotency_key.parse("idempotency_key");

    expect("indexes" in idempotencyMetadata).toBe(true);
    if (!("indexes" in idempotencyMetadata)) {
      throw new Error("idempotency_key must be a persisted property");
    }
    expect(idempotencyMetadata.indexes).toContainEqual({ type: "unique" });
    expect(checkNames(PaymentAttempt)).toEqual(
      expect.arrayContaining([
        "payment_attempt_amount_nonnegative_check",
        "payment_attempt_number_positive_check",
        "payment_attempt_currency_code_check",
      ]),
    );
  });

  it("defines provider-scoped webhook replay protection", () => {
    expect(indexNames(PaymentWebhookEvent)).toEqual(
      expect.arrayContaining([
        "IDX_payment_webhook_provider_event",
        "IDX_payment_webhook_provider_payment",
        "IDX_payment_webhook_processing_status",
      ]),
    );
    expect(checkNames(PaymentWebhookEvent)).toContain(
      "payment_webhook_attempts_nonnegative_check",
    );
  });

  it("indexes audit correlation and resource lookups", () => {
    expect(indexNames(AuditLog)).toEqual(
      expect.arrayContaining([
        "IDX_audit_log_resource",
        "IDX_audit_log_action",
        "IDX_audit_log_correlation_id",
      ]),
    );
  });

  it("requires complete encrypted document and terms bundles", () => {
    expect(checkNames(CustomerProfile)).toEqual(
      expect.arrayContaining([
        "customer_profile_document_bundle_check",
        "customer_profile_terms_bundle_check",
      ]),
    );
  });
});
