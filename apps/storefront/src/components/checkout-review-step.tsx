import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import type { CheckoutCustomerInfo, CheckoutPaymentSelection, PaymentResult } from "@/lib/payments/contracts"
import { createPaymentFrontendAdapter } from "@/lib/payments/adapter"
import { completeCartOrder } from "@/lib/data/checkout/complete"
import { PaymentResultView } from "@/components/payment-result"
import type { HttpTypes } from "@medusajs/types"
import { useNavigate, useParams } from "@tanstack/react-router"
import { useEffect, useRef, useState } from "react"

type ReviewStepProps = {
  cart: HttpTypes.StoreCart
  prepared: CheckoutPreparedSummary
  selection: CheckoutPaymentSelection
  customer: CheckoutCustomerInfo
  authenticated: boolean
  customerId?: string | null
  onEditCustomer: () => void
  onEditDelivery: () => void
  onBack: () => void
  onPaymentSubmitting: (method: CheckoutPaymentSelection["method"]) => void
  onPaymentResult: (result: PaymentResult) => void
}

const Address = ({ address }: { address: NonNullable<CheckoutPreparedSummary["address"]> }) => (
  <p className="mt-2 text-sm leading-6 text-zinc-700">
    {address.firstName} {address.lastName}<br />
    {address.city}, {address.province} - {address.postalCode}
  </p>
)

const maskDocument = (document: string): string => {
  const digits = document.replace(/\D/g, "")
  return digits.length <= 4 ? digits : `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`
}

export default function CheckoutReviewStep({
  cart,
  prepared,
  selection,
  customer,
  authenticated,
  customerId,
  onEditCustomer,
  onEditDelivery,
  onBack,
  onPaymentSubmitting,
  onPaymentResult,
}: ReviewStepProps) {
  const currency = cart.currency_code || "brl"
  const navigate = useNavigate()
  const { countryCode } = useParams({ strict: false })
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<PaymentResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const completionStarted = useRef(false)
  const paymentResultRef = useRef<PaymentResult | null>(null)
  paymentResultRef.current = result

  useEffect(() => {
    if (!result || result.uiState !== "pending" || !result.publicReference) return
    const publicReference = result.publicReference
    let active = true
    let attempts = 0
    const adapter = createPaymentFrontendAdapter()
    const poll = async () => {
      if (!active || attempts >= 180) return
      attempts += 1
      try {
        const next = await adapter.getStatus({
          cartId: prepared.cartId,
          prepared,
          payer: {
            email: customer.email,
            firstName: customer.firstName,
            lastName: customer.lastName,
            document: customer.document,
            documentType: customer.personType === "business" ? "CNPJ" : "CPF",
          },
        }, publicReference)
        if (!active) return
        setResult(next)
      } catch {
        // Keep the pending state; a transient status read must not imply failure.
      }
    }
    const timer = window.setInterval(() => void poll(), 5_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [customer, prepared, result])

  useEffect(() => {
    if (!result || result.uiState !== "approved" || completionStarted.current) return
    completionStarted.current = true
    void completeCartOrder()
      .then((order) => {
        const current = paymentResultRef.current
        if (current) setResult({ ...current, publicReference: order.id })
        navigate({
          to: `/${countryCode || "br"}/order/${order.id}/confirmed`,
          replace: true,
        })
      })
      .catch((completionError) => {
        completionStarted.current = false
        setError(completionError instanceof Error
          ? completionError.message
          : "Nao foi possivel concluir o pedido apos a aprovacao do pagamento.")
      })
  }, [countryCode, navigate, result])
  const confirmPayment = async () => {
    if (submitting || !consent) return
    setSubmitting(true)
    setError(null)
    onPaymentSubmitting(selection.method)
    try {
      const adapter = createPaymentFrontendAdapter()
      const payment = await adapter.confirmPayment({ cartId: prepared.cartId, prepared, payer: { email: customer.email, firstName: customer.firstName, lastName: customer.lastName, document: customer.document, documentType: customer.personType === "business" ? "CNPJ" : "CPF" } }, selection.method, selection.card)
      setResult(payment)
      onPaymentResult(payment)
    } catch (error) {
      setError(error instanceof Error
        ? error.message
        : "Nao foi possivel iniciar o pagamento. Revise os dados e tente novamente.")
    } finally {
      setSubmitting(false)
    }
  }

  if (result) return <PaymentResultView result={result} onRetry={result.uiState === "rejected" || result.uiState === "error" ? () => setResult(null) : undefined} onBack={onBack} backLabel="Trocar forma de pagamento" />

  return (
    <div className="space-y-5">
      <p className="text-sm text-[var(--color-text-muted)]">Confira as informacoes antes de iniciar a tentativa de pagamento.</p>

      <section className="rounded-xl border border-[var(--color-border)] p-4" aria-labelledby="review-customer-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="review-customer-title" className="font-semibold text-[var(--color-navy)]">Dados</h3>
            <p className="mt-2 text-sm font-medium text-zinc-900">{customer.firstName} {customer.lastName}</p>
            <p className="mt-1 text-sm text-zinc-700">{customer.email}</p>
            <p className="mt-1 text-sm text-zinc-700">{customer.phone}</p>
            {customer.document && <p className="mt-1 text-sm text-zinc-700">CPF/CNPJ: {maskDocument(customer.document)}</p>}
            {authenticated && Boolean(customerId) && <p className="mt-2 text-sm text-[var(--color-text-muted)]">Compra vinculada à sua conta.</p>}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onEditCustomer}>Alterar</Button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] p-4" aria-labelledby="review-receipt-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="review-receipt-title" className="font-semibold text-[var(--color-navy)]">Recebimento</h3>
            <p className="mt-2 text-sm font-medium text-zinc-900">{prepared.shipping.name}</p>
            {prepared.address ? <Address address={prepared.address} /> : <p className="mt-2 text-sm leading-6 text-zinc-700">Retirada na Loja 1<br />Alameda Glete, 663 - Campos Eliseos, Sao Paulo/SP<br />Voce recebera uma confirmacao quando o pedido estiver pronto para retirada.</p>}
            {prepared.shipping.deliveryEstimate && <p className="mt-2 text-sm text-zinc-600">{prepared.shipping.deliveryEstimate}</p>}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onEditDelivery}>Alterar</Button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] p-4" aria-labelledby="review-payment-title">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 id="review-payment-title" className="font-semibold text-[var(--color-navy)]">Pagamento</h3>
            <p className="mt-2 text-sm text-zinc-700">{selection.method === "pix" ? "Pix" : "Cartao de credito"}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onBack}>Alterar</Button>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--color-border)] p-4" aria-labelledby="review-items-title">
        <h3 id="review-items-title" className="font-semibold text-[var(--color-navy)]">Produtos e valores</h3>
        <div className="mt-3 divide-y divide-zinc-200">
          {prepared.items.map((item) => <div key={item.id} className="flex justify-between gap-3 py-2 text-sm"><span>{item.title} x {item.quantity}</span><Price price={item.lineTotal} currencyCode={currency} /></div>)}
        </div>
        <dl className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd><Price price={prepared.subtotal} currencyCode={currency} /></dd></div>
          <div className="flex justify-between"><dt>Entrega</dt><dd><Price price={prepared.shippingTotal} currencyCode={currency} /></dd></div>
          <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold"><dt>Total</dt><dd><Price price={prepared.total} currencyCode={currency} /></dd></div>
        </dl>
      </section>

      <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">O pagamento sera iniciado somente apos sua confirmacao explicita.</p>
      <label className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-white p-4 text-sm"><input type="checkbox" required checked={consent} onChange={(event) => setConsent(event.target.checked)} className="mt-1 h-4 w-4" /><span>Confirmo que revisei os dados e os valores do pedido.</span></label>
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      <div className="flex flex-col gap-3 border-t border-[var(--color-border)] pt-5 sm:flex-row"><Button type="button" variant="secondary" onClick={onBack} disabled={submitting}>Alterar pagamento</Button><Button type="button" onClick={confirmPayment} disabled={!consent || submitting}>{submitting ? "Processando pagamento..." : "Confirmar e pagar"}</Button></div>
    </div>
  )
}
