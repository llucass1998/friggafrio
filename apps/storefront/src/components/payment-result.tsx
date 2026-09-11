import { Button } from "@/components/ui/button"
import type { PaymentResult } from "@/lib/payments/contracts"
import { useState } from "react"

type PaymentResultProps = {
  result: PaymentResult
  onRetry?: () => void
  onBack?: () => void
  backLabel?: string
}

const copy: Record<PaymentResult["uiState"], { title: string; description: string }> = {
  pending: {
    title: "Pagamento aguardando confirmação",
    description: "Escaneie o QR Code ou copie o código Pix abaixo no aplicativo do seu banco para pagar. A confirmação é automática após o pagamento.",
  },
  approved: {
    title: "Pagamento aprovado com sucesso!",
    description: "Seu pagamento foi confirmado pelo banco. Finalizando seu pedido...",
  },
  rejected: {
    title: "Pagamento recusado",
    description: "Não foi possível autorizar o pagamento. Revise os dados informados ou escolha outra forma de pagamento.",
  },
  expired: {
    title: "Código de pagamento expirado",
    description: "O prazo para pagamento expirou. Escolha a forma de pagamento para gerar uma nova tentativa.",
  },
  cancelled: {
    title: "Pagamento cancelado",
    description: "A tentativa foi cancelada sem cobrança.",
  },
  error: {
    title: "Não foi possível processar o pagamento",
    description: "Ocorreu uma instabilidade ao processar a tentativa. Tente novamente ou escolha outra forma de pagamento.",
  },
}

export const PaymentResultView = ({ result, onRetry, onBack, backLabel }: PaymentResultProps) => {
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
      setCopyError("Não foi possível copiar o código automaticamente. Selecione-o para copiar manualmente.")
    }
  }
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-sm sm:p-7" aria-labelledby="payment-result-title">
      <h3 id="payment-result-title" className="text-lg font-bold text-[var(--color-navy)]">{content.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{content.description}</p>
      {result.pix?.qrCodeBase64 && (
        <div className="mt-5 text-center">
          <img
            className="mx-auto h-52 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-sm"
            alt="QR Code Pix para pagamento"
            src={`data:image/png;base64,${result.pix.qrCodeBase64}`}
          />
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">Abra o app do seu banco e escolha a opção Pagar com Pix / QR Code</p>
        </div>
      )}
      {result.pix?.copyPasteCode && (
        <div className="mt-5 rounded-xl bg-[var(--color-surface-soft)] p-4 text-sm">
          <p className="font-semibold text-[var(--color-navy)]">Código Pix Copia e Cola</p>
          <code className="mt-2 block max-h-24 overflow-y-auto break-all rounded-lg border border-zinc-200 bg-white p-2.5 font-mono text-xs text-[var(--color-text-muted)] select-all">
            {result.pix.copyPasteCode}
          </code>
          <Button className="mt-3" type="button" variant="secondary" onClick={() => void copyPix()}>
            {copied ? "Código copiado!" : "Copiar código Pix"}
          </Button>
          <p className="sr-only" aria-live="polite">{copied ? "Código Pix copiado com sucesso para a área de transferência." : copyError || ""}</p>
          {copyError && <p className="mt-2 text-xs text-red-800" role="alert">{copyError}</p>}
        </div>
      )}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {onRetry && <Button type="button" onClick={onRetry}>Tentar novamente</Button>}
        {onBack && (
          <Button type="button" variant="secondary" onClick={onBack}>
            {backLabel || (result.uiState === "pending" ? "Trocar forma de pagamento" : "Voltar ao pagamento")}
          </Button>
        )}
      </div>
    </section>
  )
}
