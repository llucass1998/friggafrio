import { z } from "zod"

export const passwordSchema = z
  .string({ required_error: "A senha é obrigatória" })
  .min(8, "A senha deve possuir pelo menos 8 caracteres")
  .max(100, "A senha é muito longa")

// Utils para validar formato bruto ignorando pontuação se vier com ela
const cpfRegex = /^\d{11}$/
const cnpjRegex = /^\d{14}$/

export const personRegistrationSchema = z.object({
  firstName: z.string({ required_error: "Informe seu nome" }).min(2, "Informe seu nome").trim(),
  lastName: z.string({ required_error: "Informe seu sobrenome" }).min(2, "Informe seu sobrenome").trim(),
  email: z.string({ required_error: "Informe um e-mail válido" }).email("Informe um e-mail válido").toLowerCase().trim(),
  phone: z.string({ required_error: "Informe um telefone válido" }).min(10, "Informe um telefone válido").trim(),
  cpf: z.string().optional().refine((val) => {
    if (!val) return true
    const unmasked = val.replace(/\D/g, "")
    return cpfRegex.test(unmasked)
  }, "Informe um CPF válido"),
  password: passwordSchema,
  confirmPassword: z.string({ required_error: "Confirme a senha" }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os Termos de Uso e a Política de Privacidade" })
  }),
  acceptMarketing: z.boolean().default(false).optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não são iguais",
  path: ["confirmPassword"]
})

export const companyRegistrationSchema = z.object({
  firstName: z.string({ required_error: "Informe o nome do responsável" }).min(2, "Informe o nome do responsável").trim(),
  lastName: z.string({ required_error: "Informe o sobrenome do responsável" }).min(2, "Informe o sobrenome do responsável").trim(),
  email: z.string({ required_error: "Informe um e-mail válido" }).email("Informe um e-mail válido").toLowerCase().trim(),
  phone: z.string({ required_error: "Informe um telefone válido" }).min(10, "Informe um telefone válido").trim(),
  cnpj: z.string({ required_error: "Informe um CNPJ válido" }).min(14, "Informe um CNPJ válido").refine((val) => {
    const unmasked = val.replace(/\D/g, "")
    return cnpjRegex.test(unmasked)
  }, "Informe um CNPJ válido"),
  companyName: z.string({ required_error: "Informe a razão social" }).min(2, "Informe a razão social").trim(),
  tradeName: z.string().optional(),
  stateRegistration: z.string().optional(),
  isExemptStateRegistration: z.boolean().default(false),
  password: passwordSchema,
  confirmPassword: z.string({ required_error: "Confirme a senha" }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os Termos de Uso e a Política de Privacidade" })
  }),
  acceptMarketing: z.boolean().default(false).optional()
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não são iguais",
  path: ["confirmPassword"]
}).refine(data => data.isExemptStateRegistration || (data.stateRegistration && data.stateRegistration.trim().length > 0), {
  message: "Informe a inscrição estadual ou marque como isento",
  path: ["stateRegistration"]
})

export type PersonRegistrationForm = z.infer<typeof personRegistrationSchema>
export type CompanyRegistrationForm = z.infer<typeof companyRegistrationSchema>
