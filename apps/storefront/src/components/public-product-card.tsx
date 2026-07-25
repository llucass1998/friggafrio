import { Link, useParams } from "@tanstack/react-router"
import type { HttpTypes } from "@medusajs/types"
import { ProductImagePlaceholder } from "./product/ProductImagePlaceholder"

interface PublicProductCardProps {
  product: HttpTypes.StoreProduct
  isNew?: boolean
}

export function PublicProductCard({ product, isNew = false }: PublicProductCardProps) {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const thumbnail = product.thumbnail || product.images?.[0]?.url
  const sku = product.variants?.[0]?.sku || "N/A"

  // Brand pode vir do metadado ou collection
  const metadata = product.metadata as Record<string, any> || {}
  const brand = (metadata.brand as string) || product.collection?.title || "Friggafrio"

  // Controle de Preço e Orçamento
  const isDemoPrice = metadata.is_demo_price === true
  const hasRealImages = metadata.has_real_images === true

  // Preço
  const brlPrice = product.variants?.[0]?.calculated_price?.calculated_amount
    ? product.variants[0].calculated_price.calculated_amount
    : null

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

        {!hasRealImages && (
          <span className="absolute bottom-3 right-3 z-10 px-2 py-1 text-[10px] font-semibold text-[var(--color-text-muted)] bg-white/80 backdrop-blur-sm rounded-[4px] shadow-sm">
            Imagem em breve
          </span>
        )}

        {thumbnail && hasRealImages ? (
          <img
            src={thumbnail}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ProductImagePlaceholder productName={product.title} />
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
             {brlPrice && isDemoPrice ? (
               <>
                 <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded w-fit mb-1 border border-amber-200">
                   Valor em configuração
                 </span>
                 <span className="text-lg font-bold text-[var(--color-text)]">
                   R$ {(brlPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
               </>
             ) : brlPrice ? (
                 <span className="text-lg font-bold text-[var(--color-text)]">
                   R$ {(brlPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                 </span>
             ) : (
                <span className="text-xs text-[var(--color-text-muted)] italic">Consulte o valor</span>
             )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link
              to={"/$countryCode/products/$handle" as string} params={{ countryCode, handle: product.handle }}
              className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-semibold text-[var(--color-primary)] bg-white border border-[var(--color-primary)] rounded-[var(--radius-button-sm)] hover:bg-[var(--color-surface-soft)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] col-span-1"
            >
              Detalhes
            </Link>
            <button
              className="flex items-center justify-center w-full px-3 py-2.5 text-sm font-semibold text-[var(--color-navy)] bg-[var(--color-background)] border border-[var(--color-border)] rounded-[var(--radius-button-sm)] hover:bg-gray-200 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] col-span-1"
            >
              Orçamento
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
