import { defineMiddlewares } from "@medusajs/medusa"
import { validateDemoPriceCheckout } from "./middlewares/validate-demo-price"
import { companyMiddlewares } from "./store/company/middlewares"
import { employeesMiddlewares } from "./store/employees/middlewares"
import { customersMiddlewares } from "./store/customers/middlewares"
import { googleMiddlewares } from "./store/google/middlewares"

export default defineMiddlewares({
  routes: [
    {
      method: "POST",
      matcher: "/store/carts/:id/payment-collections",
      middlewares: [validateDemoPriceCheckout],
    },
    {
      method: "POST",
      matcher: "/store/carts/:id/complete",
      middlewares: [validateDemoPriceCheckout],
    },
    ...companyMiddlewares,
    ...employeesMiddlewares,
    ...customersMiddlewares,
    ...googleMiddlewares
  ],
})
