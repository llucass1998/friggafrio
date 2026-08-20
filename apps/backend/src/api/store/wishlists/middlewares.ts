import type { MiddlewareRoute } from "@medusajs/framework/http"
import { authenticate } from "@medusajs/medusa"

export const wishlistMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/wishlists*",
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
]
