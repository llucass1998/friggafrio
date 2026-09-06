import { createFileRoute } from "@tanstack/react-router"

function CookiesPolicyPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8" aria-labelledby="cookies-title">
      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-sm sm:p-10">
        <h1 id="cookies-title" className="text-3xl font-bold text-[var(--color-navy)]">Política de Cookies</h1>
        <p className="mt-4 leading-7 text-[var(--color-text-muted)]">Utilizamos apenas cookies necessários para o funcionamento da loja e, quando autorizados, métricas anônimas de Analytics.</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-[var(--color-text)]">
          <section><h2 className="font-bold text-[var(--color-navy)]">Essenciais</h2><p>Recursos próprios necessários para sessão, carrinho, região e preferências básicas.</p></section>
          <section><h2 className="font-bold text-[var(--color-navy)]">Analytics</h2><p>Ativado somente após consentimento explícito. A preferência é armazenada sem dados pessoais.</p></section>
          <section><h2 className="font-bold text-[var(--color-navy)]">Marketing</h2><p>Não utilizado nesta versão.</p></section>
          <p className="text-[var(--color-text-muted)]">Prazos e fornecedores específicos permanecem sujeitos à validação jurídica e técnica dos serviços ativos.</p>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute("/$countryCode/politica-de-cookies")({ component: CookiesPolicyPage })
