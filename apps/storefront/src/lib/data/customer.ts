import { sdk } from "@/lib/medusa"

export interface RegisterCustomerInput {
  email: string
  password?: string
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, unknown>
}

export const registerCustomer = async (data: RegisterCustomerInput) => {
  return await sdk.client.fetch("/store/customers/register", {
    method: "POST",
    body: data,
  })
}
