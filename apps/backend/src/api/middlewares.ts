import {
  authRateLimit,
  registerRateLimit,
  globalApiRateLimit,
  secureHeaders,
} from "./middlewares/rate-limiting";
import { authenticate, defineMiddlewares } from "@medusajs/medusa";
import { validateDemoPriceCheckout } from "./middlewares/validate-demo-price";
import { releaseCartLineInventoryReservation } from "./middlewares/release-cart-inventory-reservation";
import {
  invalidateCartCheckoutPreparation,
  requireCheckoutPreparation,
} from "./middlewares/invalidate-checkout-preparation";
import { companyMiddlewares } from "./store/company/middlewares";
import { employeesMiddlewares } from "./store/employees/middlewares";
import { customersMiddlewares } from "./store/customers/middlewares";
import { googleMiddlewares } from "./store/google/middlewares";
import {
  blockOrderCompletionUntilGate8,
  blockPaymentsWhenDisabled,
  blockUnsafePaymentConfirmation,
} from "./middlewares/payment-containment";
import {
  protectSessionMutation,
  requireTrustedAuthOrigin,
} from "../lib/auth/session-security";

export default defineMiddlewares({
  routes: [
    {
      matcher: /.*/,
      middlewares: [secureHeaders],
    },
    {
      matcher: "^/store(?:/|$)",
      middlewares: [globalApiRateLimit],
    },
    {
      matcher: /^\/store(?:\/|$)/,
      methods: ["POST", "PUT", "PATCH", "DELETE"],
      middlewares: [protectSessionMutation],
    },
    {
      matcher: /^\/auth\/(?:session|token\/refresh)$/,
      methods: ["POST", "DELETE"],
      middlewares: [requireTrustedAuthOrigin, authRateLimit],
    },
    {
      matcher: "/auth/customer/google",
      method: "POST",
      middlewares: [requireTrustedAuthOrigin, authRateLimit],
    },
    {
      method: "POST",
      matcher: "/store/customers/me/orders/:id/pay",
      middlewares: [blockUnsafePaymentConfirmation],
    },
    {
      method: "POST",
      matcher: "/store/customers/me/orders/:id/payment-session",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/company/initiate-checkout-session",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/checkout",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/admin/orders/:id/refund",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/webhooks/mercado-pago",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/company/payment-methods",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/payment-collections/:id/payment-sessions",
      middlewares: [blockPaymentsWhenDisabled],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/payment-collections",
      middlewares: [blockPaymentsWhenDisabled, validateDemoPriceCheckout],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/complete",
      middlewares: [blockOrderCompletionUntilGate8, blockPaymentsWhenDisabled, requireCheckoutPreparation, validateDemoPriceCheckout],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/prepare",
      middlewares: [authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true })],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/checkout-ready",
      middlewares: [authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true })],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/line-items/:line_id",
      middlewares: [invalidateCartCheckoutPreparation, releaseCartLineInventoryReservation],
    },
    {
      method: "DELETE",
      matcher: "/store/carts/:id/line-items/:line_id",
      middlewares: [invalidateCartCheckoutPreparation, releaseCartLineInventoryReservation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/shipping-methods",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/taxes",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/customer",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: ["POST", "DELETE"],
      matcher: "/store/carts/:id/promotions",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/payment-collections",
      middlewares: [invalidateCartCheckoutPreparation],
    },
    ...companyMiddlewares,
    ...employeesMiddlewares,
    ...customersMiddlewares,
    ...googleMiddlewares,
  ],
});
