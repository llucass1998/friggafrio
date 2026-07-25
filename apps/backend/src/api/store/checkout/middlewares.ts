import { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export const storeCheckoutMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/checkout",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
]
