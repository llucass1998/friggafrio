import { MiddlewareRoute } from "@medusajs/medusa"
import cors from "cors"
import { getTrustedStoreOrigins } from "../../../../lib/auth/session-security"

export const googleMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/google/*",
    middlewares: [
      cors({
        origin: (origin, callback) => {
          if (!origin || getTrustedStoreOrigins().has(origin)) return callback(null, true)
          return callback(new Error("Untrusted Google integration origin"))
        },
        credentials: true,
      }),
    ],
  },
]
