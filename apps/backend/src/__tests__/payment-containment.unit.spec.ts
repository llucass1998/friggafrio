import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  PAYMENT_UNAVAILABLE_CODE,
  PAYMENT_UNAVAILABLE_MESSAGE,
  getPaymentAvailability,
  sendPaymentUnavailable,
} from "../utils/payment-availability";

describe("payment containment", () => {
  it("fails closed when flags are absent", () => {
    expect(getPaymentAvailability({})).toEqual({
      paymentsEnabled: false,
      providerEnabled: false,
      processingEnabled: false,
    });
  });

  it("requires both flags to be explicitly true", () => {
    expect(
      getPaymentAvailability({
        PAYMENTS_ENABLED: "true",
        PAYMENT_PROVIDER_ENABLED: "false",
      }).processingEnabled,
    ).toBe(false);

    expect(
      getPaymentAvailability({
        PAYMENTS_ENABLED: " TRUE ",
        PAYMENT_PROVIDER_ENABLED: "true",
      }).processingEnabled,
    ).toBe(true);
  });

  it("returns a controlled 503 response without reporting success", () => {
    const json = jest.fn();
    const status = jest.fn(() => ({ json }));

    sendPaymentUnavailable({ status });

    expect(status).toHaveBeenCalledWith(503);
    expect(json).toHaveBeenCalledWith({
      type: "temporarily_unavailable",
      code: PAYMENT_UNAVAILABLE_CODE,
      message: PAYMENT_UNAVAILABLE_MESSAGE,
    });
  });

  it("keeps the customer pay route free of arbitrary paid-state workflows", () => {
    const routePath = resolve(
      process.cwd(),
      "src/api/store/customers/me/orders/[id]/pay/route.ts",
    );
    const source = readFileSync(routePath, "utf8");

    expect(source).not.toContain("markPaymentCollectionAsPaid");
    expect(source).not.toContain("payment_status");
    expect(source).toContain("blockUnsafePaymentConfirmation");
  });

  it("keeps the legacy custom checkout route fail-closed", () => {
    const routeSource = readFileSync(
      resolve(process.cwd(), "src/api/store/checkout/route.ts"),
      "utf8",
    );
    const middlewareSource = readFileSync(
      resolve(process.cwd(), "src/api/middlewares.ts"),
      "utf8",
    );

    expect(routeSource).toContain("sendPaymentUnavailable");
    expect(routeSource).not.toContain("checkoutWorkflow");
    expect(routeSource).not.toContain("paymentSession");
    expect(middlewareSource).toContain('matcher: "/store/checkout"');
  });

  it.each([
    ["admin refund", "src/api/admin/orders/[id]/refund/route.ts"],
    ["Mercado Pago webhook", "src/api/webhooks/mercado-pago/route.ts"],
  ])("keeps %s unavailable before provider homologation", (_name, path) => {
    const routeSource = readFileSync(resolve(process.cwd(), path), "utf8");

    expect(routeSource).toContain("sendPaymentUnavailable");
    expect(routeSource).not.toContain("refundPayment");
    expect(routeSource).not.toContain("processMercadoPagoWebhookWorkflow");
  });
});
