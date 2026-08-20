import { MiddlewareRoute, validateAndTransformBody } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { authRateLimit, registerRateLimit } from "../../middlewares/rate-limiting"

const RegisterCustomerSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(100),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const PasswordResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  redirect_url: z.string().startsWith("/").max(500).refine((value) => !value.startsWith("//"), {
    message: "redirect_url must be a relative path",
  }).optional(),
})

const PasswordResetConfirmationSchema = z.object({
  token: z.string().min(1).max(4096),
  password: z.string().min(8).max(100),
})

export const customersMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/customers/register",
    method: "POST",
    middlewares: [
      registerRateLimit,
      validateAndTransformBody(RegisterCustomerSchema),
    ],
  },
  {
    matcher: "/store/customers/password-reset",
    method: "POST",
    middlewares: [authRateLimit, validateAndTransformBody(PasswordResetRequestSchema)],
  },
  {
    matcher: "/store/customers/password-reset/confirm",
    method: "POST",
    middlewares: [authRateLimit, validateAndTransformBody(PasswordResetConfirmationSchema)],
  },
]
