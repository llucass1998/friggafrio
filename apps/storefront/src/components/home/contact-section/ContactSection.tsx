"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, AlertCircle, Loader2, Send } from "lucide-react";

// Match exactly with the backend requirements
const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().optional(),
  subject: z
    .string()
    .max(120, "Assunto deve ter no máximo 120 caracteres")
    .optional(),
  message: z
    .string()
    .min(10, "Mensagem deve ter pelo menos 10 caracteres")
    .max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
  website: z.string().max(0, "Honeypot acionado").optional().or(z.literal("")),
});

type ContactFormData = z.infer<typeof contactSchema>;

export function ContactSection() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
  });

  const mutation = useMutation({
    mutationFn: async (data: ContactFormData) => {
      // Usando URL relativa que deve ser interceptada pelo dev server ou proxy, ou usar MEDUSA_BACKEND_URL
      const apiUrl =
        import.meta.env.VITE_MEDUSA_BACKEND_URL || "http://localhost:9000";

      const payload = {
        name: data.name,
        email: data.email,
        subject: data.subject || "Contato via site",
        message: data.message,
      };

      const response = await fetch(`${apiUrl}/store/contact-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          console.error(e);
        }

        throw new Error(
          errorData?.message ||
            "Ocorreu um erro ao enviar sua mensagem. Tente novamente mais tarde.",
        );
      }

      return response.json();
    },
    onSuccess: () => {
      setIsSuccess(true);
      setErrorMsg(null);
      reset();

      // Auto-hide success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    },
    onError: (error: Error) => {
      setIsSuccess(false);
      setErrorMsg(error.message);
    },
  });

  const onSubmit = (data: ContactFormData) => {
    mutation.mutate(data);
  };

  return (
    <section
      className="bg-white border-y border-gray-100 py-10 md:py-14 w-full"
      id="contato"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 xl:gap-20">
          {/* Left Column - Copy */}
          <div className="lg:w-[36%] xl:w-[32%] flex flex-col justify-center text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--color-navy)] mb-2">
              Fale com a FriggaFrio
            </h2>
            <h3 className="text-sm font-semibold text-gray-800 mb-3">
              Converse com nossos técnicos e consultores de vendas.
            </h3>
            <p className="text-sm text-gray-500 leading-relaxed max-w-full">
              Envie sua dúvida e nossa equipe entrará em contato pelos dados
              informados.
            </p>
          </div>

          {/* Right Column - Compact Form */}
          <div className="lg:flex-1 w-full">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in duration-500 h-full">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  Mensagem enviada com sucesso!
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
                  Agradecemos o seu contato. Nossa equipe técnica retornará o
                  mais breve possível.
                </p>
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-5 py-2 bg-[var(--color-primary)] text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors"
                >
                  Enviar nova mensagem
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit(onSubmit)}
                className="w-full flex flex-col gap-4"
              >
                {errorMsg && (
                  <div
                    className="bg-red-50 border border-red-200 p-3 rounded text-sm mb-2"
                    role="alert"
                  >
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2 flex-shrink-0" />
                      <p className="text-red-700">{errorMsg}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Name */}
                  <div className="relative">
                    <input
                      {...register("name")}
                      id="name"
                      type="text"
                      className="peer w-full px-4 pt-5 pb-2 bg-white border border-gray-300 rounded text-sm placeholder-transparent focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors"
                      placeholder="Nome completo"
                      disabled={mutation.isPending}
                      aria-invalid={!!errors.name}
                      autoComplete="name"
                    />
                    <label
                      htmlFor="name"
                      className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--color-primary)] pointer-events-none"
                    >
                      Nome completo *
                    </label>
                    {errors.name && (
                      <p className="text-xs text-red-600 mt-1" role="alert">
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <input
                      {...register("email")}
                      id="email"
                      type="email"
                      className="peer w-full px-4 pt-5 pb-2 bg-white border border-gray-300 rounded text-sm placeholder-transparent focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors"
                      placeholder="E-mail"
                      disabled={mutation.isPending}
                      aria-invalid={!!errors.email}
                      autoComplete="email"
                    />
                    <label
                      htmlFor="email"
                      className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--color-primary)] pointer-events-none"
                    >
                      E-mail *
                    </label>
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-1" role="alert">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <input
                      {...register("phone")}
                      id="phone"
                      type="tel"
                      className="peer w-full px-4 pt-5 pb-2 bg-white border border-gray-300 rounded text-sm placeholder-transparent focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors"
                      placeholder="Telefone"
                      disabled={mutation.isPending}
                      aria-invalid={!!errors.phone}
                      autoComplete="tel"
                    />
                    <label
                      htmlFor="phone"
                      className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--color-primary)] pointer-events-none"
                    >
                      Telefone (opcional)
                    </label>
                    {errors.phone && (
                      <p className="text-xs text-red-600 mt-1" role="alert">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  {/* Subject */}
                  <div className="relative">
                    <input
                      {...register("subject")}
                      id="subject"
                      type="text"
                      className="peer w-full px-4 pt-5 pb-2 bg-white border border-gray-300 rounded text-sm placeholder-transparent focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors"
                      placeholder="Assunto"
                      disabled={mutation.isPending}
                      aria-invalid={!!errors.subject}
                    />
                    <label
                      htmlFor="subject"
                      className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--color-primary)] pointer-events-none"
                    >
                      Assunto (opcional)
                    </label>
                    {errors.subject && (
                      <p className="text-xs text-red-600 mt-1" role="alert">
                        {errors.subject.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div className="relative">
                  <textarea
                    {...register("message")}
                    id="message"
                    rows={2}
                    className="peer w-full px-4 pt-5 pb-2 bg-white border border-gray-300 rounded text-sm placeholder-transparent focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-colors resize-y min-h-[60px]"
                    placeholder="Mensagem"
                    disabled={mutation.isPending}
                    aria-invalid={!!errors.message}
                  ></textarea>
                  <label
                    htmlFor="message"
                    className="absolute left-4 top-2 text-xs text-gray-500 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-[var(--color-primary)] pointer-events-none"
                  >
                    Mensagem *
                  </label>
                  {errors.message && (
                    <p className="text-xs text-red-600 mt-1" role="alert">
                      {errors.message.message}
                    </p>
                  )}
                </div>

                {/* Honeypot */}
                <div
                  className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden"
                  aria-hidden="true"
                >
                  <label htmlFor="website">Website</label>
                  <input
                    {...register("website")}
                    id="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                {/* Footer and Submit */}
                <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-4 mt-2">
                  <p className="text-xs text-gray-400 md:w-2/3 text-left">
                    Ao enviar este formulário, você concorda com nossa Política
                    de Privacidade. Seus dados não serão compartilhados.
                  </p>
                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full md:w-auto md:min-w-[160px] flex items-center justify-center bg-[var(--color-navy)] text-white text-sm font-semibold rounded px-6 py-2.5 hover:bg-opacity-90 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <span>Enviar</span>
                        <Send className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
