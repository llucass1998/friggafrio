import { z } from "zod"

// Validates the address logic: ensure state is 'sp', postal_code format, and no CPF in fields since backend doesn't support it natively
export const checkoutAddressSchema = z.object({
  first_name: z.string().min(1, "Obrigatório"),
  last_name: z.string().min(1, "Obrigatório"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(1, "Obrigatório"),
  postal_code: z.string().transform(v => v.replace(/\D/g, '')).pipe(z.string().length(8, "CEP inválido (8 dígitos)")),
  logradouro: z.string().min(1, "Obrigatório"),
  numero: z.string().min(1, "Obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Obrigatório"),
  city: z.string().min(1, "Obrigatória"),
  province: z.string().min(1, "Obrigatório").transform(v => v.toLowerCase()).refine(
    (val) => ["sp", "são paulo", "sao paulo", "sãopaulo", "saopaulo"].includes(val),
    { message: "No momento, realizamos entregas somente no estado de São Paulo." }
  ),
  cpf_cnpj: z.string().optional().transform(v => v ? v.replace(/\D/g, '') : ""), // Captured locally but mapped to metadata
})

export type CheckoutAddressData = z.infer<typeof checkoutAddressSchema>
