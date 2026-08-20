import { Link, useParams } from "@tanstack/react-router"
import { FormEvent, useState } from "react"
import { sdk } from "@/lib/medusa"

export default function ForgotPasswordPage() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      await sdk.client.fetch("/store/customers/password-reset", {
        method: "POST",
        body: {
          email: email.trim().toLowerCase(),
          redirect_url: `/${countryCode}/account/reset-password`,
        },
      })
      setIsSent(true)
    } catch {
      // Keep this message neutral so the endpoint does not reveal registered accounts.
      setError("Nao foi possivel solicitar a redefinicao agora. Tente novamente em alguns minutos.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--color-surface-soft)] px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card sm:p-8">
        <Link to="/$countryCode/account/login" params={{ countryCode }} className="text-sm font-medium text-[var(--color-primary)] hover:underline">
          Voltar para entrar
        </Link>
        <h1 className="mt-6 text-2xl font-semibold text-[var(--color-navy)] sm:text-3xl">Recuperar senha</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
          Informe seu e-mail para receber as instrucoes de redefinicao de senha.
        </p>

        {isSent ? (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">
            Se houver uma conta com este e-mail, enviaremos as instrucoes para recuperar o acesso.
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]" htmlFor="email">E-mail</label>
              <input
                className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]"
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com"
              />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            <button className="w-full rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-3 font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Enviando..." : "Enviar instrucoes"}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
