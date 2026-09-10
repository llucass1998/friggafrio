import type { PublicSpec } from "@/lib/utils/public-product-specs"

interface ProductSpecificationsTableProps {
  specs: PublicSpec[]
  compact?: boolean
  className?: string
}

export function ProductSpecificationsTable({ specs, compact = false, className = "" }: ProductSpecificationsTableProps) {
  if (!specs || specs.length === 0) {
    return <p className="text-sm italic text-[var(--color-text-muted)]">Nenhuma especificação cadastrada no momento.</p>
  }

  return (
    <div className={`overflow-x-auto rounded-lg border border-[#d7e2ea] bg-white ${className}`}>
      <table className={`w-full min-w-0 border-collapse text-left ${compact ? "text-xs sm:text-sm" : "text-sm sm:text-base"}`}>
        <thead>
          <tr className="border-b border-[#d7e2ea] bg-[#f0f6fb]">
            <th scope="col" className="w-2/5 px-4 py-2.5 font-semibold text-[var(--color-navy)]">
              Característica
            </th>
            <th scope="col" className="w-3/5 px-4 py-2.5 font-semibold text-[var(--color-navy)]">
              Valor
            </th>
          </tr>
        </thead>
        <tbody>
          {specs.map(({ label, value }) => (
            <tr key={label} className="border-b border-[#e8f1f7] last:border-b-0 hover:bg-[#f8fbfe] transition-colors">
              <th scope="row" className="w-2/5 px-4 py-2.5 font-semibold text-[var(--color-navy)] bg-[#f4f8fb]/70 break-words">
                {label}
              </th>
              <td className="w-3/5 px-4 py-2.5 text-[var(--color-text)] break-words">
                {value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ProductSpecificationsTable
