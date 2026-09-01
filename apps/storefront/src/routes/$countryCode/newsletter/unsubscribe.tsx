import { createFileRoute, Link, useSearch } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { sdk } from "@/lib/medusa"
import { pageMeta } from "@/lib/seo"

export const Route = createFileRoute("/$countryCode/newsletter/unsubscribe")({
  validateSearch: (search: Record<string, unknown>) => ({ token: typeof search.token === "string" ? search.token : "" }),
  head: ({ params }) => pageMeta({
    title: "Cancelar inscrição | FriggaFrio",
    description: "Cancele o recebimento de novidades e promoções da FriggaFrio.",
    path: `/${params.countryCode}/newsletter/unsubscribe`,
    indexable: false,
  }),
  component: NewsletterUnsubscribePage,
})

function NewsletterUnsubscribePage() {
  const { token } = useSearch({ from: "/$countryCode/newsletter/unsubscribe" })
  const [state, setState] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    let cancelled = false
    if (!token) {
      setState("error")
      return () => { cancelled = true }
    }
    sdk.client.fetch<{ status: string }>("/store/newsletter/unsubscribe", {
      method: "POST",
      body: { token },
    }).then(() => {
      if (!cancelled) setState("success")
    }).catch(() => {
      if (!cancelled) setState("error")
    })
    return () => { cancelled = true }
  }, [token])

  return (
    <main className="flex min-h-[calc(100vh-8rem)] items-center justify-center bg-[var(--color-surface-soft)] px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-card">
        <h1 className="text-2xl font-semibold text-[var(--color-navy)]">Cancelar inscrição</h1>
        {state === "loading" && <p className="mt-4 text-[var(--color-text-muted)]" role="status">Atualizando sua preferência...</p>}
        {state === "success" && <p className="mt-4 text-[var(--color-text-muted)]" role="status">Sua inscrição foi cancelada. Você não receberá novas promoções.</p>}
        {state === "error" && <p className="mt-4 text-[var(--color-text-muted)]" role="alert">Não foi possível validar este link. Solicite um novo cancelamento pelo e-mail recebido.</p>}
        <Link className="mt-6 inline-flex text-[var(--color-primary)] underline" to="/$countryCode" params={{ countryCode: "br" }}>Voltar para a loja</Link>
      </section>
    </main>
  )
}
