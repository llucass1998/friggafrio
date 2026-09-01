import { Button } from "@/components/ui/button"
import type { PaymentResult } from "@/lib/payments/contracts"
import { useState } from "react"

type PaymentResultProps = { result: PaymentResult; onRetry?: () => void; onBack?: () => void }
const copy: Record<PaymentResult["uiState"], { title: string; description: string }> = {
  pending: { title: "Pagamento aguardando confirmacao", description: "A confirmacao sera consultada pelo backend e pelo webhook assinado." },
  approved: { title: "Pagamento aprovado", description: "Este estado so pode ser confirmado pelo backend." },
  rejected: { title: "Pagamento recusado", description: "Revise os dados ou escolha outra forma de pagamento." },
  expired: { title: "Pagamento expirado", description: "Gere uma nova tentativa quando estiver disponivel." },
  cancelled: { title: "Pagamento cancelado", description: "A tentativa foi encerrada sem cobranca." },
  error: { title: "Nao foi possivel processar", description: "Tente novamente." },
}

export const PaymentResultView = ({ result, onRetry, onBack }: PaymentResultProps) => {
  const content = copy[result.uiState]
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState<string | null>(null)
  const copyPix = async () => {
    const value = result.pix?.copyPasteCode
    if (!value || !navigator.clipboard) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setCopyError(null)
    } catch {
      setCopied(false)
      setCopyError("Nao foi possivel copiar o codigo. Selecione-o para copiar manualmente.")
    }
  }
  return <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="payment-result-title">
    <h3 id="payment-result-title" className="text-lg font-bold text-[var(--color-navy)]">{content.title}</h3>
    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{content.description}</p>
    {result.pix?.qrCodeBase64 && <img className="mx-auto mt-5 h-48 w-48" alt="QR Code Pix para pagamento" src={`data:image/png;base64,${result.pix.qrCodeBase64}`} />}
    {result.pix?.copyPasteCode && <div className="mt-5 rounded-lg bg-[var(--color-surface-soft)] p-4 text-sm"><p className="font-semibold text-[var(--color-navy)]">Codigo Pix</p><code className="mt-2 block break-all text-xs text-[var(--color-text-muted)]">{result.pix.copyPasteCode}</code><Button className="mt-3" type="button" variant="secondary" onClick={() => void copyPix()}>{copied ? "Codigo copiado" : "Copiar codigo Pix"}</Button><p className="sr-only" aria-live="polite">{copied ? "Codigo Pix copiado." : copyError || ""}</p>{copyError && <p className="mt-2 text-xs text-red-800" role="alert">{copyError}</p>}</div>}
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">{onRetry && <Button type="button" onClick={onRetry}>Tentar novamente</Button>}{onBack && <Button type="button" variant="secondary" onClick={onBack}>Voltar ao pagamento</Button>}</div>
  </section>
}
