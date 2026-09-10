import { useState } from "react"
import { CheckCircle2, Mail, Send } from "lucide-react"
import { subscribeToNewsletter } from "@/lib/data/newsletter"

const CONSENT_VERSION = "2026-08"

type FormState = "idle" | "loading" | "confirmation_pending" | "validation_error" | "server_error"

export function NewsletterSignup() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [consent, setConsent] = useState(false)
  const [website, setWebsite] = useState("")
  const [state, setState] = useState<FormState>("idle")

  const message = state === "confirmation_pending"
    ? "Cadastro registrado. Confira seu e-mail para confirmar a inscrição."
    : state === "validation_error"
      ? "Informe nome, e-mail válido e confirme seu consentimento."
      : state === "server_error"
        ? "Não foi possível concluir o cadastro agora. Tente novamente."
        : null

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedName || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || !consent) {
      setState("validation_error")
      return
    }

    setState("loading")
    try {
      await subscribeToNewsletter({
        name: normalizedName,
        email: normalizedEmail,
        consent: true,
        consent_version: CONSENT_VERSION,
        source: "storefront",
        locale: "pt-BR",
        website,
      })
      setState("confirmation_pending")
    } catch {
      setState("server_error")
    }
  }

  return (
    <section aria-labelledby="newsletter-title" className="border-t border-[var(--color-border)] bg-[#f3f9fd] px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-[1180px] overflow-hidden rounded-[22px] border border-[#d9e8f2] bg-white shadow-[0_16px_42px_rgba(8,59,102,0.10)]">
        <div className="grid lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <div className="bg-[#e8f5fb] p-7 sm:p-9 lg:p-11">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--color-primary)] shadow-sm"><Mail className="h-6 w-6" aria-hidden="true" /></div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Novidades FriggaFrio</p>
            <h2 id="newsletter-title" className="mt-3 text-3xl font-bold tracking-tight text-[var(--color-navy)] sm:text-4xl">Fique por dentro da FriggaFrio</h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--color-text-muted)] sm:text-base">Receba novidades, conteúdos técnicos e ofertas selecionadas diretamente no seu e-mail.</p>
          </div>
          <form onSubmit={submit} noValidate className="p-7 sm:p-9 lg:p-11">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-[var(--color-navy)]">Nome
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={160} aria-invalid={state === "validation_error" && !name.trim()} className="mt-2 min-h-[48px] w-full rounded-xl border border-[#cbdde9] px-3 text-base font-normal outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
              <label className="text-sm font-semibold text-[var(--color-navy)]">E-mail
                <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" maxLength={320} aria-invalid={state === "validation_error" && !/^\S+@\S+\.\S+$/.test(email.trim())} className="mt-2 min-h-[48px] w-full rounded-xl border border-[#cbdde9] px-3 text-base font-normal outline-none transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </label>
            </div>
            <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
              <label>Website<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
            </div>
            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm leading-6 text-[var(--color-text-muted)]">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]" />
              <span>Quero receber por e-mail novidades, lançamentos e promoções da FriggaFrio. Posso cancelar a inscrição a qualquer momento. Consulte a <a href="/br/privacidade" className="font-semibold text-[var(--color-primary)] underline underline-offset-2">Política de Privacidade</a>.</span>
            </label>
            {message && <p id="newsletter-feedback" role={state === "server_error" || state === "validation_error" ? "alert" : "status"} aria-live="polite" className={`mt-5 flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${state === "server_error" || state === "validation_error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}><CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />{message}</p>}
            <button type="submit" disabled={!consent || state === "loading" || state === "confirmation_pending"} aria-describedby={message ? "newsletter-feedback" : undefined} className="mt-6 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 font-bold text-white transition hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto">{state === "loading" ? "Enviando..." : state === "confirmation_pending" ? "Confirmação enviada" : "Quero receber novidades"}<Send className="h-4 w-4" aria-hidden="true" /></button>
          </form>
        </div>
      </div>
    </section>
  )
}
