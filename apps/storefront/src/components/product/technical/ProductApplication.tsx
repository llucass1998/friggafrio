import { Layers, CheckCircle2 } from "lucide-react"

interface ProductApplicationProps {
  application?: string | null
  compatibility?: string | null
  className?: string
}

export function ProductApplication({ application, compatibility, className = "" }: ProductApplicationProps) {
  const hasApp = Boolean(application?.trim())
  const hasComp = Boolean(compatibility?.trim())

  if (!hasApp && !hasComp) {
    return <p className="text-sm italic text-[var(--color-text-muted)]">Nenhuma informação de aplicação ou compatibilidade cadastrada.</p>
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {hasApp && (
        <section aria-labelledby="app-heading" className="rounded-xl border border-[#d7e2ea] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="app-heading" className="text-base font-bold text-[var(--color-navy)]">
              Aplicação recomendada
            </h3>
          </div>
          <div className="text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-line sm:text-base">
            {application}
          </div>
        </section>
      )}

      {hasComp && (
        <section aria-labelledby="comp-heading" className="rounded-xl border border-[#d7e2ea] bg-white p-5 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="comp-heading" className="text-base font-bold text-[var(--color-navy)]">
              Compatibilidade confirmada
            </h3>
          </div>
          <div className="text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-line sm:text-base">
            {compatibility}
          </div>
          <p className="mt-3 text-xs text-[var(--color-text-muted)] italic">
            * Dados de compatibilidade fornecidos diretamente pelo fabricante ou catálogo técnico oficial.
          </p>
        </section>
      )}
    </div>
  )
}

export default ProductApplication
