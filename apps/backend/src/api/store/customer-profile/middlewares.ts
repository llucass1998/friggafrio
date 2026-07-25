import { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export const customerProfileMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customer-profile",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
]
