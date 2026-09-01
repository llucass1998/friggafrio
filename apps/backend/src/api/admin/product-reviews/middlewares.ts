import type { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export const productReviewAdminMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/product-reviews*",
    middlewares: [authenticate("user", ["session", "bearer"])],
  },
]
