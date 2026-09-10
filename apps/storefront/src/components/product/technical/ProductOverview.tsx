import { Layers, PackageCheck, FileText, Download, ArrowRight } from "lucide-react"
import type { PublicSpec } from "@/lib/utils/public-product-specs"
import { ProductSpecificationsTable } from "@/components/product/technical/ProductSpecificationsTable"

interface DocumentItem {
  name: string
  url: string
  format?: string
  size?: string
}

interface ProductOverviewProps {
  description: string
  specs: PublicSpec[]
  application?: string | null
  packageContents?: string[] | null
  documents: DocumentItem[]
  onNavigateTab: (tabId: string) => void
}

export function ProductOverview({
  description,
  specs,
  application,
  packageContents,
  documents,
  onNavigateTab,
}: ProductOverviewProps) {
  const hasDescription = Boolean(description?.trim())
  const hasSpecs = specs && specs.length > 0
  const hasApp = Boolean(application?.trim())
  const hasContents = Boolean(packageContents && packageContents.length > 0)
  const hasDocs = Boolean(documents && documents.length > 0)

  // Split description into paragraphs (up to 2 paragraphs for overview)
  const paragraphs = description
    ? description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
    : []
  const overviewParagraphs = paragraphs.slice(0, 2)

  // Bottom cards
  const bottomCardsCount = (hasApp ? 1 : 0) + (hasContents ? 1 : 0) + (hasDocs ? 1 : 0)

  return (
    <div className="space-y-8">
      {/* Top section: 2 columns on desktop when both description and specs exist */}
      <div className={`grid gap-8 ${hasDescription && hasSpecs ? "lg:grid-cols-2 lg:gap-10 items-start" : "grid-cols-1"}`}>
        {hasDescription && (
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[var(--color-navy)] sm:text-xl">
              Sobre o produto
            </h2>
            <div className="space-y-3 text-sm leading-relaxed text-[var(--color-text)] sm:text-base">
              {overviewParagraphs.length > 0 ? (
                overviewParagraphs.map((p, idx) => (
                  <p key={idx} className="whitespace-pre-line">{p}</p>
                ))
              ) : (
                <p className="whitespace-pre-line">{description}</p>
              )}
            </div>
            {paragraphs.length > 2 && (
              <p className="text-xs text-[var(--color-text-muted)] italic">
                * Para especificações e aplicações completas, consulte as abas ao lado.
              </p>
            )}
          </div>
        )}

        {hasSpecs && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[var(--color-navy)] sm:text-xl">
                Especificações técnicas
              </h2>
              {specs.length > 6 && (
                <button
                  type="button"
                  onClick={() => onNavigateTab("specifications")}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                >
                  Ver todas ({specs.length})
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </div>
            <ProductSpecificationsTable specs={specs.slice(0, 6)} compact />
          </div>
        )}
      </div>

      {/* Bottom section: 3 aligned cards when data is available */}
      {bottomCardsCount > 0 && (
        <div className="pt-4 border-t border-[#e8f1f7]">
          <div
            className={`grid gap-5 ${
              bottomCardsCount === 3
                ? "grid-cols-1 md:grid-cols-3"
                : bottomCardsCount === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 max-w-md"
            }`}
          >
            {/* Card 1: Aplicação */}
            {hasApp && (
              <div className="flex h-full flex-col justify-between rounded-xl border border-[#d7e2ea] bg-white p-5 shadow-sm transition-all hover:border-[#b3cfe4] hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
                      <Layers className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-navy)]">
                      Aplicação
                    </h3>
                  </div>
                  <p className="line-clamp-3 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {application}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e8f1f7]">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("application-compatibility")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    Ver detalhes de aplicação
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Card 2: O que acompanha */}
            {hasContents && (
              <div className="flex h-full flex-col justify-between rounded-xl border border-[#d7e2ea] bg-white p-5 shadow-sm transition-all hover:border-[#b3cfe4] hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
                      <PackageCheck className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-navy)]">
                      O que acompanha
                    </h3>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-[var(--color-text-muted)]">
                    {packageContents!.slice(0, 3).map((item, i) => (
                      <li key={i} className="line-clamp-1 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)] shrink-0" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e8f1f7]">
                  <button
                    type="button"
                    onClick={() => onNavigateTab("package")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    Ver itens inclusos
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* Card 3: Manual ou ficha técnica */}
            {hasDocs && (
              <div className="flex h-full flex-col justify-between rounded-xl border border-[#d7e2ea] bg-white p-5 shadow-sm transition-all hover:border-[#b3cfe4] hover:shadow-md">
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
                      <FileText className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-base font-bold text-[var(--color-navy)]">
                      Manual ou ficha técnica
                    </h3>
                  </div>
                  <p className="line-clamp-2 text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                    {documents[0].name}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#e8f1f7]">
                  <a
                    href={documents[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    Baixar PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductOverview
