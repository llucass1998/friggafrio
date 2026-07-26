import {
  MiddlewareRoute,
  validateAndTransformBody,
  authenticate,
} from "@medusajs/framework/http";
import { z } from "@medusajs/framework/zod";

const SetupCompanySchema = z.object({
  // Auth credentials
  email: z.string().email(),
  password: z.string().min(8).max(100),
  // Company data
  company_name: z.string(),
  company_email: z.string().email(),
  company_phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  country_code: z.string().optional(),
  logo_url: z.string().optional(),
  // Admin customer data
  admin_first_name: z.string(),
  admin_last_name: z.string(),
  admin_phone: z.string().optional(),
});

const CreateCompanyAddressSchema = z.object({
  name: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  company_name: z.string().nullable().optional(),
  address_1: z.string(),
  address_2: z.string().nullable().optional(),
  city: z.string(),
  province: z.string().nullable().optional(),
  postal_code: z.string(),
  country_code: z.string(),
  phone: z.string().nullable().optional(),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
  is_billing_only: z.boolean().optional(),
});

const UpdateCompanyAddressSchema = z.object({
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  company_name: z.string().nullable().optional(),
  address_1: z.string().optional(),
  address_2: z.string().nullable().optional(),
  city: z.string().optional(),
  province: z.string().nullable().optional(),
  postal_code: z.string().optional(),
  country_code: z.string().optional(),
  phone: z.string().nullable().optional(),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
  is_billing_only: z.boolean().optional(),
});

const UpdateMyCompanySchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  postal_code: z.string().nullable().optional(),
  country_code: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  spend_limit_reset_frequency: z
    .enum(["none", "daily", "weekly", "monthly", "yearly"])
    .optional(),
});

export const companyMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/company",
    method: "POST",
    middlewares: [
      // No authentication required - this is a registration endpoint
      validateAndTransformBody(SetupCompanySchema),
    ],
  },
  {
    matcher: "/store/company/me",
    method: "POST",
    middlewares: [
      authenticate("customer", ["session"]),
      validateAndTransformBody(UpdateMyCompanySchema),
    ],
  },
  {
    matcher: "/store/company/checkout-payment-methods",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/initiate-checkout-session",
    method: "POST",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/payment-methods",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/payment-methods",
    method: "POST",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/payment-methods/:id",
    method: "DELETE",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/addresses",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/addresses",
    method: "POST",
    middlewares: [
      authenticate("customer", ["session"]),
      validateAndTransformBody(CreateCompanyAddressSchema),
    ],
  },
  {
    matcher: "/store/company/addresses/:id",
    method: "POST",
    middlewares: [
      authenticate("customer", ["session"]),
      validateAndTransformBody(UpdateCompanyAddressSchema),
    ],
  },
  {
    matcher: "/store/company/addresses/:id",
    method: "DELETE",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/setup-status",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/orders",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
  {
    matcher: "/store/company/quotes",
    method: "GET",
    middlewares: [authenticate("customer", ["session"])],
  },
];
