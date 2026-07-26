import { MiddlewareRoute } from "@medusajs/medusa"
import cors from "cors"

export const googleMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/google/*",
    middlewares: [
      cors({
        origin: "*", // Idealmente, restrinja isso para as URLs do Storefront na produção
        credentials: true,
      }),
    ],
  },
]
