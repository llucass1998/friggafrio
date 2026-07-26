import { defineMiddlewares } from "@medusajs/medusa";
import { validateDemoPriceCheckout } from "./middlewares/validate-demo-price";
import { companyMiddlewares } from "./store/company/middlewares";
import { employeesMiddlewares } from "./store/employees/middlewares";
import { customersMiddlewares } from "./store/customers/middlewares";
import { googleMiddlewares } from "./store/google/middlewares";
import {
  blockPaymentsWhenDisabled,
  blockUnsafePaymentConfirmation,
} from "./middlewares/payment-containment";

export default defineMiddlewares({
  routes: [
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
      middlewares: [blockPaymentsWhenDisabled, validateDemoPriceCheckout],
    },
    ...companyMiddlewares,
    ...employeesMiddlewares,
    ...customersMiddlewares,
    ...googleMiddlewares,
  ],
});
