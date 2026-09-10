import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import { mountMercadoPagoCardBrick, type MercadoPagoBrickErrorCode } from "@/lib/payments/mercado-pago-sdk"
import type { CheckoutPaymentSelection, PaymentMethodId } from "@/lib/payments/contracts"
import { isMercadoPagoFrontendConfigured, mercadoPagoPublicKey } from "@/lib/payments/runtime"
import type { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState } from "react"

type PaymentStepProps = {
  cart: HttpTypes.StoreCart
  prepared: CheckoutPreparedSummary
  selection: CheckoutPaymentSelection | null
  onSelectionChange: (selection: CheckoutPaymentSelection | null) => void
  onNext: () => void
  onBack: () => void
}

type CardBrick = { unmount?: () => void }

export default function CheckoutPaymentStep({ cart, prepared, selection, onSelectionChange, onNext, onBack }: PaymentStepProps) {
  const [error, setError] = useState<string | null>(null)
  const [brickReady, setBrickReady] = useState(false)
  const brickRef = useRef<CardBrick | null>(null)
  const brickMountQueueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    let disposed = false
    setBrickReady(false)
    if (selection?.method !== "card") return
    if (!isMercadoPagoFrontendConfigured) {
      setError("O pagamento com cartão ainda não está configurado neste ambiente.")
      return
    }

    const mount = async () => {
      // React development effects may mount, clean up, and mount again before
      // the SDK resolves. Serialize creation so two Bricks never target one node.
      await brickMountQueueRef.current
      if (disposed) return
      try {
        const brick = await mountMercadoPagoCardBrick({
          publicKey: mercadoPagoPublicKey,
          containerId: "mercado-pago-secure-card-mount",
          amount: prepared.total,
          payerEmail: prepared.email,
          onSubmit: async (formData) => {
            if (disposed) return
            const token = typeof formData.token === "string" ? formData.token : ""
            const paymentMethodId = typeof formData.payment_method_id === "string" ? formData.payment_method_id : undefined
            const installments = typeof formData.installments === "number" ? Math.min(10, Math.max(1, formData.installments)) : 1
            if (!token) {
              setError("Nao foi possivel tokenizar o cartao com seguranca.")
              return
            }
            onSelectionChange({ method: "card", card: { secureMountId: "mercado-pago-secure-card-mount", token, paymentMethodId, installments } })
          },
          onError: (sdkError) => {
            if (disposed) return
            const code: MercadoPagoBrickErrorCode = typeof sdkError === "object" && sdkError !== null && "code" in sdkError &&
              (["SDK_CONSTRUCTOR_ERROR", "SDK_BRICKS_UNAVAILABLE", "BRICK_CREATE_REJECTED", "SDK_CALLBACK_ERROR"] as string[]).includes(String((sdkError as { code?: unknown }).code))
              ? String((sdkError as { code?: unknown }).code) as MercadoPagoBrickErrorCode
              : "BRICK_CREATE_REJECTED"
            setError(`Nao foi possivel carregar o formulario seguro do Mercado Pago. (${code})`)
          },
        })
        if (disposed) brick.unmount?.()
        else {
          brickRef.current = brick
          setBrickReady(true)
        }
      } catch (sdkError) {
        if (!disposed) {
          const code = sdkError instanceof Error && (["SDK_CONSTRUCTOR_ERROR", "SDK_BRICKS_UNAVAILABLE", "BRICK_CREATE_REJECTED"] as string[]).includes(sdkError.message)
            ? sdkError.message
            : "BRICK_CREATE_REJECTED"
          setError(`Nao foi possivel carregar o formulario seguro do Mercado Pago. (${code})`)
        }
      }
    }
    const queuedMount = mount()
    brickMountQueueRef.current = queuedMount.catch(() => undefined)

    return () => {
      disposed = true
      brickRef.current?.unmount?.()
      brickRef.current = null
      setBrickReady(false)
    }
  }, [onSelectionChange, prepared.email, prepared.total, selection?.method])

  const choose = (method: PaymentMethodId) => {
    setError(null)
    onSelectionChange(method === "pix"
      ? { method: "pix" }
      : { method: "card", card: { secureMountId: "mercado-pago-secure-card-mount", installments: 1 } })
  }
  const continueToReview = () => {
    if (!selection) return setError("Escolha uma forma de pagamento.")
    if (selection.method === "card" && !selection.card?.token) return setError("Conclua a tokenizacao no formulario seguro do Mercado Pago para continuar.")
    if (selection.method === "card") onSelectionChange({ method: "card", card: { ...selection.card, secureMountId: "mercado-pago-secure-card-mount", installments: selection.card?.installments || 1 } })
    onNext()
  }
  const methods: Array<{ id: PaymentMethodId; label: string; description: string }> = [
    { id: "pix", label: "Pix", description: "O pedido sera confirmado apos o pagamento." },
    { id: "card", label: "Cartao de credito", description: "Pagamento processado com seguranca pelo Mercado Pago." },
  ]

  return <div className="space-y-6">
    <section className="rounded-xl border border-[var(--color-border)] bg-sky-50 p-4" aria-labelledby="payment-total-title">
      <h3 id="payment-total-title" className="font-semibold text-[var(--color-navy)]">Total confirmado pelo servidor</h3>
      <p className="mt-2 text-2xl font-bold text-[var(--color-navy)]"><Price price={prepared.total} currencyCode={cart.currency_code || "brl"} /></p>
    </section>
    <p className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950" role="status">A tentativa so sera criada apos a confirmacao explicita na revisao.</p>
    <div className="grid gap-3" role="radiogroup" aria-label="Forma de pagamento">
      {methods.map((method) => {
        const selected = selection?.method === method.id
        return <button key={method.id} type="button" role="radio" aria-checked={selected} onClick={() => choose(method.id)} className={`min-h-24 rounded-xl border p-4 text-left transition-colors ${selected ? "border-[var(--color-primary)] bg-sky-50" : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]"}`}>
          <span className="font-semibold text-[var(--color-navy)]">{method.label}</span><span className="mt-1 block text-sm text-[var(--color-text-muted)]">{method.description}</span>
        </button>
      })}
    </div>
    {selection?.method === "card" && <section className="rounded-xl border border-[var(--color-border)] p-4" aria-labelledby="secure-card-title">
      <h3 id="secure-card-title" className="font-semibold text-[var(--color-navy)]">Cartao de credito</h3>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">A FriggaFrio nao armazena dados do cartao.</p>
      <div id="mercado-pago-secure-card-mount" className="mt-4 min-h-56 rounded-lg border border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600" aria-busy={!brickReady}>
        {!brickReady && "Carregando formulario seguro do Mercado Pago..."}
      </div>
      <p className="mt-3 text-sm text-[var(--color-text-muted)]">O Mercado Pago informa parcelas elegiveis, limitadas a 10x sem juros.</p>
    </section>}
    {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">{error}</p>}
    <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row"><Button type="button" variant="secondary" onClick={onBack}>Voltar</Button><Button type="button" data-testid="checkout-payment-next" onClick={continueToReview} disabled={!selection || (selection.method === "card" && (!brickReady || !selection.card?.token))}>Continuar para revisao</Button></div>
  </div>
}
