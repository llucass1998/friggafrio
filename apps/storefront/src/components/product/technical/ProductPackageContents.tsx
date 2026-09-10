import { PackageCheck, Check } from "lucide-react"

interface ProductPackageContentsProps {
  contents?: string[] | null
  className?: string
}

export function ProductPackageContents({ contents, className = "" }: ProductPackageContentsProps) {
  if (!contents || contents.length === 0) {
    return <p className="text-sm italic text-[var(--color-text-muted)]">Informações sobre os itens inclusos não disponíveis.</p>
  }

  return (
    <div className={`rounded-xl border border-[#d7e2ea] bg-white p-5 sm:p-6 shadow-sm ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
          <PackageCheck className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="text-base font-bold text-[var(--color-navy)]">
          Itens inclusos na embalagem
        </h3>
      </div>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {contents.map((item, index) => (
          <li key={index} className="flex items-center gap-2.5 rounded-lg bg-[#f8fbfe] px-3.5 py-2.5 text-sm text-[var(--color-text)]">
            <Check className="h-4 w-4 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
            <span className="font-medium">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ProductPackageContents
