import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

const RegisterCustomerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const customersMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/register",
    method: "POST",
    middlewares: [
      validateAndTransformBody(RegisterCustomerSchema),
    ],
  }
]
