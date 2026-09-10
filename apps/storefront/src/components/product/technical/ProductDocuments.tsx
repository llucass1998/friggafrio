import { FileText, Download } from "lucide-react"

interface DocumentItem {
  name: string
  url: string
  format?: string
  size?: string
}

interface ProductDocumentsProps {
  documents: DocumentItem[]
  className?: string
}

export function ProductDocuments({ documents, className = "" }: ProductDocumentsProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className={`rounded-xl border border-[#d7e2ea] bg-[#f8fbfe] p-6 text-center text-sm text-[var(--color-text-muted)] ${className}`}>
        <FileText className="mx-auto mb-2 h-8 w-8 text-[#8eaec7]" aria-hidden="true" />
        <p className="font-medium text-[var(--color-navy)]">Ficha técnica ainda não disponível.</p>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">A documentação técnica oficial deste produto será disponibilizada em breve.</p>
      </div>
    )
  }

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}>
      {documents.map((doc) => (
        <div
          key={doc.url}
          className="flex flex-col justify-between rounded-xl border border-[#d7e2ea] bg-white p-5 shadow-sm transition-all hover:border-[#b3cfe4] hover:shadow-md"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#eef7fd] text-[var(--color-primary)]">
              <FileText className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-[var(--color-navy)] break-words">{doc.name}</h4>
              <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {doc.format || "PDF"} {doc.size ? `• ${doc.size}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-[#e8f1f7]">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Baixar documento
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProductDocuments
