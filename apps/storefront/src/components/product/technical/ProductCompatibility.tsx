import { CheckCircle2 } from "lucide-react"

interface ProductCompatibilityProps {
  compatibility?: string | null
  className?: string
}

export function ProductCompatibility({ compatibility, className = "" }: ProductCompatibilityProps) {
  if (!compatibility || !compatibility.trim()) {
    return <p className="text-sm italic text-[var(--color-text-muted)]">Nenhum dado de compatibilidade cadastrado.</p>
  }

  return (
    <div className={`rounded-xl border border-[#d7e2ea] bg-white p-5 sm:p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-[var(--color-navy)]">
          Compatibilidade confirmada
        </h3>
      </div>
      <div className="text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-line sm:text-base">
        {compatibility}
      </div>
    </div>
  )
}

export default ProductCompatibility
