import { useEffect, useState } from "react"
import { useLocation } from "@tanstack/react-router"
import { hasAnalyticsConsentDecision, initializeAnalyticsConsent, loadAnalytics, readAnalyticsConsent, trackAnalyticsEvent, writeAnalyticsConsent } from "@/lib/analytics"

const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined
const CONSENT_VERSION = "2026-09"

export function AnalyticsConsent() {
  const location = useLocation()
  const [consent, setConsent] = useState(() => readAnalyticsConsent())
  const [open, setOpen] = useState(() => !hasAnalyticsConsentDecision())
  const [customize, setCustomize] = useState(false)

  useEffect(() => {
    initializeAnalyticsConsent()
    const openPreferences = () => { setOpen(true); setCustomize(true) }
    window.addEventListener("friggafrio:privacy-preferences", openPreferences)
    return () => window.removeEventListener("friggafrio:privacy-preferences", openPreferences)
  }, [])

  useEffect(() => {
    if (consent !== "granted" || !measurementId) return
    void loadAnalytics(measurementId).then(() => trackAnalyticsEvent("page_view", { page_location: location.href }))
  }, [consent, location.href])

  const update = (next: "granted" | "denied") => {
    writeAnalyticsConsent(next)
    localStorage.setItem("friggafrio:consent-version", CONSENT_VERSION)
    localStorage.setItem("friggafrio:consent-date", new Date().toISOString())
    setConsent(next)
    setOpen(false)
    setCustomize(false)
  }

  if (!open) return null
  return (
    <aside className="fixed inset-x-4 bottom-4 z-[70] mx-auto max-w-xl rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-xl" aria-label="Preferências de privacidade">
      <h2 className="text-base font-bold text-[var(--color-navy)]">Preferências de privacidade</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text)]">Os cookies essenciais mantêm a loja funcionando. Analytics e marketing ficam desativados por padrão.</p>
      {customize && <div className="mt-3 rounded-lg bg-[var(--color-background)] p-3 text-sm text-[var(--color-text-muted)]"><p><strong>Essenciais:</strong> sempre ativos para sessão, carrinho e região.</p><p className="mt-1"><strong>Analytics:</strong> métricas anônimas somente após aceite.</p><p className="mt-1"><strong>Marketing:</strong> não utilizado nesta versão.</p></div>}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => update("granted")} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Aceitar opcionais</button>
        <button type="button" onClick={() => update("denied")} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-navy)]">Recusar opcionais</button>
        <button type="button" onClick={() => setCustomize((value) => !value)} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-navy)]">Configurar cookies</button>
      </div>
    </aside>
  )
}
