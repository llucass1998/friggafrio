import { Link, useParams } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"
import { confirmNewsletterSubscription, unsubscribeNewsletter } from "@/lib/data/newsletter"

type Action = "confirm" | "unsubscribe"
type State = "loading" | "success" | "invalid" | "error"

export default function NewsletterActionPage({ action }: { action: Action }) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"
  const [state, setState] = useState<State>("loading")
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = new URLSearchParams(window.location.search).get("token")
    if (!token) {
      setState("invalid")
      return
    }
    const request = action === "confirm" ? confirmNewsletterSubscription : unsubscribeNewsletter
    void request(token)
      .then((response) => setState(response.status === "confirmed" || response.status === "unsubscribed" ? "success" : "invalid"))
      .catch(() => setState("error"))
  }, [action])

  const copy = action === "confirm"
    ? {
        title: "Confirmação da newsletter",
        success: "Cadastro confirmado! Agora você receberá as novidades da FriggaFrio.",
        invalid: "Este link é inválido ou expirou. Solicite um novo cadastro pelo site.",
      }
    : {
        title: "Descadastro da newsletter",
        success: "Seu cadastro foi cancelado. Você não receberá novas comunicações.",
        invalid: "Este link de descadastro é inválido.",
      }

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[#f3f9fd] px-4 py-12 sm:px-6">
      <section className="w-full max-w-xl rounded-[22px] border border-[#d9e8f2] bg-white p-7 text-center shadow-[0_16px_42px_rgba(8,59,102,0.10)] sm:p-10" aria-live="polite">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-primary)]">Novidades FriggaFrio</p>
        <h1 className="mt-3 text-2xl font-bold text-[var(--color-navy)] sm:text-3xl">{copy.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">
          {state === "loading" ? "Processando seu pedido..." : state === "success" ? copy.success : state === "invalid" ? copy.invalid : "Não foi possível processar seu pedido agora. Tente novamente mais tarde."}
        </p>
        <Link to="/$countryCode" params={{ countryCode }} className="mt-7 inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-5 font-bold text-white hover:bg-[var(--color-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">Voltar para a loja</Link>
      </section>
    </main>
  )
}
