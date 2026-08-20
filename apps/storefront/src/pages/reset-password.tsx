import { Link, useParams } from "@tanstack/react-router"
import { FormEvent, useEffect, useState } from "react"
import { sdk } from "@/lib/medusa"

export default function ResetPasswordPage() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token") || "")
  }, [])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    if (!token) {
      setError("O link de redefinicao esta ausente ou expirou. Solicite um novo link.")
      return
    }
    if (password.length < 8) {
      setError("Use uma senha com pelo menos 8 caracteres.")
      return
    }
    if (password !== confirmation) {
      setError("As senhas nao conferem.")
      return
    }

    setIsSubmitting(true)
    try {
      await sdk.client.fetch("/store/customers/password-reset/confirm", {
        method: "POST",
        body: { token, password },
      })
      setIsComplete(true)
    } catch {
      setError("Nao foi possivel redefinir a senha. Solicite um novo link e tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--color-surface-soft)] px-4 py-10 sm:px-6">
      <section className="w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-card sm:p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)] sm:text-3xl">Definir nova senha</h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">Crie uma senha forte para voltar a acessar sua conta.</p>

        {isComplete ? (
          <div className="mt-6 space-y-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900" role="status">
            <p>Sua senha foi atualizada com sucesso.</p>
            <Link to="/$countryCode/account/login" params={{ countryCode }} className="font-semibold text-[var(--color-primary)] hover:underline">Entrar na conta</Link>
          </div>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]" htmlFor="password">Nova senha</label>
              <input className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]" id="password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]" htmlFor="confirmation">Confirmar nova senha</label>
              <input className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]" id="confirmation" type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
            </div>
            {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}
            <button className="w-full rounded-[var(--radius-button)] bg-[var(--color-primary)] px-4 py-3 font-bold text-white transition hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
              {isSubmitting ? "Salvando..." : "Salvar nova senha"}
            </button>
          </form>
        )}
      </section>
    </main>
  )
}
