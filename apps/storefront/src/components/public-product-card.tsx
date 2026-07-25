import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  isNew?: boolean
}

export function PublicProductCard({ product, isNew = false }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const thumbnail = product.thumbnail || product.images?.[0]?.url
  const sku = product.variants?.[0]?.sku || "N/A"
  const brand = product.collection?.title || "Friggafrio"

  return (
    <div className="bg-white rounded-[var(--radius-card)] border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
      {/* Image */}
      <Link
        to={"/$countryCode/products/$handle" as string}
        params={{ countryCode, handle: product.handle }}
        className="block relative aspect-square bg-[var(--color-surface-soft)] overflow-hidden p-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-accent)]"
      >
        {isNew && (
          <span className="absolute top-3 left-3 z-10 px-2 py-1 text-xs font-semibold text-[var(--color-navy)] bg-[var(--color-accent)] rounded-[4px] uppercase tracking-wide shadow-sm">
            Novo
          </span>
        )}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--color-text-muted)]">
             <svg xmlns="http://www.w3.org/w3.org/2000/svg" className="w-12 h-12 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
             <span className="text-xs font-medium opacity-50">Sem Imagem</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase tracking-wide">
          {brand}
        </div>

        {/* Title */}
        <Link to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }} className="mb-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
          <h3 className="font-bold text-[var(--color-navy)] leading-tight hover:text-[var(--color-primary)] transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        {/* SKU */}
        <p className="text-xs text-[var(--color-text-muted)] mb-4 font-mono bg-[var(--color-background)] px-2 py-1 rounded w-fit">
          Ref: {sku}
        </p>

        {/* Actions - Bottom aligned */}
        <div className="mt-auto pt-4 border-t border-[var(--color-border)]">
          <div className="flex flex-col gap-1 mb-4">
             {/* No futuro, quando integrado à autenticação e preços de B2B, isso pode mostrar preço ou solicitar auth */}
            <span className="text-xs text-[var(--color-text-muted)] italic">Consulte o valor</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Link
              to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }}
              className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-semibold text-[var(--color-primary)] bg-white border border-[var(--color-primary)] rounded-[var(--radius-button-sm)] hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
            >
              Ver detalhes
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
