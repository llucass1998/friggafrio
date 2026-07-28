import { z } from "zod";

export const CreateContactRequestSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("E-mail inválido").transform(val => val.toLowerCase().trim()),
  phone: z.string().optional(),
  subject: z.string().max(120, "Assunto deve ter no máximo 120 caracteres").optional(),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
  website: z.string().max(0, "Honeypot acionado").optional().or(z.literal("")),
});
