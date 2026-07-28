"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react"

// Match exactly with the backend requirements
const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  subject: z.string().max(120, "Assunto deve ter no máximo 120 caracteres").optional(),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
  website: z.string().max(0, "Honeypot acionado").optional().or(z.literal("")),
})

type ContactFormData = z.infer<typeof contactSchema>

export function ContactSection() {
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      website: "",
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Usando URL relativa que deve ser interceptada pelo dev server ou proxy, ou usar MEDUSA_BACKEND_URL
      const apiUrl = import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000"

      const response = await fetch(`${apiUrl}/store/contact-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          console.error(e)
        }

        throw new Error(
          errorData?.message || "Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde."
        )
      }

      return response.json()
    },
    onSuccess: () => {
      setIsSuccess(true)
      setErrorMsg(null)
      reset()

      // Auto-hide success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000)
    },
    onError: (error: Error) => {
      setIsSuccess(false)
      setErrorMsg(error.message)
    },
  })

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data)
  }

  return (
    <section className="py-16 bg-gray-50 border-t border-gray-100" id="contato">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <h2 className="text-3xl font-bold text-[var(--color-navy)] mb-4">Fale Conosco</h2>
          <p className="text-lg text-gray-600">
            Tem dúvidas sobre nossos produtos, precisa de um orçamento específico ou quer ajuda com seu pedido? Nossa equipe especializada está pronta para ajudar.
          </p>
        </div>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-10">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Mensagem enviada com sucesso!</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Agradecemos o seu contato. Nossa equipe técnica retornará o mais breve possível.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="mt-8 px-6 py-2.5 bg-[var(--color-primary)] text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm text-red-700">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Nome completo <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("name")}
                      id="name"
                      type="text"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors outline-none"
                      placeholder="Seu nome"
                      disabled={mutation.isPending}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      E-mail <span className="text-red-500">*</span>
                    </label>
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors outline-none"
                      placeholder="seu@email.com"
                      disabled={mutation.isPending}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Phone (Optional) */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Telefone / WhatsApp
                    </label>
                    <input
                      {...register("phone")}
                      id="phone"
                      type="tel"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors outline-none"
                      placeholder="(00) 00000-0000"
                      disabled={mutation.isPending}
                    />
                  </div>

                  {/* Subject (Optional) */}
                  <div className="space-y-2 text-left">
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Assunto
                    </label>
                    <input
                      {...register("subject")}
                      id="subject"
                      type="text"
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors outline-none"
                      placeholder="Qual o motivo do contato?"
                      disabled={mutation.isPending}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-600 mt-1">{errors.subject.message}</p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2 text-left">
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                    Mensagem <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...register("message")}
                    id="message"
                    rows={5}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent transition-colors outline-none resize-y"
                    placeholder="Como podemos te ajudar? Descreva peças, orçamento desejado ou sua dúvida."
                    disabled={mutation.isPending}
                  ></textarea>
                  {errors.message && (
                    <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
                  )}
                </div>

                {/* Honeypot Field - Visually hidden but visible to bots */}
                <div className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden" aria-hidden="true">
                  <label htmlFor="website">Website (Deixe em branco)</label>
                  <input
                    {...register("website")}
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-primary)] text-white font-bold rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-100 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar Mensagem</span>
                        <Send className="w-5 h-5 ml-1" />
                      </>
                    )}
                  </button>
                </div>

                <p className="text-xs text-gray-500 text-center sm:text-left mt-4">
                  Ao enviar este formulário, você concorda com nossa Política de Privacidade. Seus dados não serão compartilhados.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
