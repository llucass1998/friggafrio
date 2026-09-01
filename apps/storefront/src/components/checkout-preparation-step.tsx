import { Button } from "@/components/ui/button"
import { Price } from "@/components/ui/price"
import { usePrepareCartForPayment } from "@/lib/hooks/use-checkout"
import { CheckoutPrepareError, type CheckoutCustomerPayload, type CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import { HttpTypes } from "@medusajs/types"
import { useCallback, useEffect, useRef, useState } from "react"

interface CheckoutPreparationStepProps {
  cart: HttpTypes.StoreCart
  onBack: () => void
  onNext: () => void
  onPrepared: (summary: CheckoutPreparedSummary) => void
  onInvalidPreparation: () => void
  prepared: CheckoutPreparedSummary | null
  customer?: CheckoutCustomerPayload
}

const CheckoutPreparationStep = ({
  cart,
  onBack,
  onNext,
  onPrepared,
  onInvalidPreparation,
  prepared,
  customer,
}: CheckoutPreparationStepProps) => {
  const prepareMutation = usePrepareCartForPayment()
  const attemptedCartId = useRef<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const prepare = useCallback(async () => {
    setErrorMessage(null)
    try {
      const summary = await prepareMutation.mutateAsync({
        shippingOptionId: cart.shipping_methods?.[0]?.shipping_option_id || undefined,
        customer,
      })
      onPrepared(summary)
    } catch (error) {
      const prepareError = error instanceof CheckoutPrepareError ? error : null
      setErrorMessage(prepareError?.message || "Não foi possível preparar o checkout. Tente novamente.")
      if (prepareError?.code?.startsWith("STALE_SHIPPING") || prepareError?.code === "SHIPPING_UNAVAILABLE" || prepareError?.code === "SHIPPING_METHOD_REQUIRED") {
        onInvalidPreparation()
      }
    }
  }, [cart.shipping_methods, customer, onInvalidPreparation, onPrepared, prepareMutation])

  useEffect(() => {
    if (prepared?.cartId === cart.id || attemptedCartId.current === cart.id) return
    attemptedCartId.current = cart.id
    void prepare()
  }, [cart.id, prepare, prepared?.cartId])

  if (!prepared || prepared.cartId !== cart.id) {
    return (
      <div className="flex flex-col gap-6" aria-busy={prepareMutation.isPending}>
        {prepareMutation.isPending && (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700" role="status">
            Conferindo valores, entrega e disponibilidade no servidor...
          </div>
        )}
        {errorMessage && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
            <p>{errorMessage}</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => void prepare()} disabled={prepareMutation.isPending}>
              Tentar novamente
            </Button>
          </div>
        )}
        <div className="flex items-center gap-4">
          <Button type="button" variant="secondary" onClick={onBack} disabled={prepareMutation.isPending}>
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8" data-testid="checkout-ready-for-payment">
      <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-emerald-950" role="status" aria-live="polite">
        <p className="font-semibold">Checkout preparado para pagamento</p>
        <p className="mt-1 text-sm">Os dados e valores abaixo foram confirmados pelo servidor.</p>
      </div>

      <section aria-labelledby="prepared-items-title" className="flex flex-col gap-3">
        <h3 id="prepared-items-title" className="text-base font-semibold text-zinc-900">Itens</h3>
        <div className="divide-y divide-zinc-200 rounded-md border border-zinc-200">
          {prepared.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-4 p-3 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900">{item.title}</p>
                <p className="text-zinc-600">Quantidade: {item.quantity} · Unitário: <Price price={item.unitPrice} currencyCode="brl" /></p>
              </div>
              <Price price={item.lineTotal} currencyCode="brl" className="shrink-0 text-zinc-900" />
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="prepared-delivery-title" className="flex flex-col gap-3">
        <h3 id="prepared-delivery-title" className="text-base font-semibold text-zinc-900">Entrega</h3>
        <div className="rounded-md border border-zinc-200 p-4 text-sm text-zinc-700">
          <p className="font-medium text-zinc-900">{prepared.shipping.name}</p>
          <p><Price price={prepared.shipping.amount} currencyCode="brl" className="text-zinc-700" /></p>
          {prepared.shipping.deliveryEstimate && <p className="mt-1">{prepared.shipping.deliveryEstimate}</p>}
          {prepared.shipping.deliveryCopy && <p className="mt-1">{prepared.shipping.deliveryCopy}</p>}
          {prepared.address && (
            <div className="mt-3 border-t border-zinc-200 pt-3">
              <p className="mb-1 font-medium text-zinc-900">Endereço de entrega</p>
              <p>{prepared.address.firstName} {prepared.address.lastName}</p>
              <p>{prepared.address.city}{prepared.address.province ? `, ${prepared.address.province}` : ""} - {prepared.address.postalCode}</p>
              <p>{prepared.address.countryCode.toUpperCase()}</p>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="prepared-total-title" className="rounded-md border border-zinc-200 p-4">
        <h3 id="prepared-total-title" className="text-base font-semibold text-zinc-900">Resumo confirmado</h3>
        <dl className="mt-3 space-y-2 text-sm text-zinc-700">
          <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd><Price price={prepared.subtotal} currencyCode="brl" /></dd></div>
          <div className="flex justify-between gap-4"><dt>Entrega</dt><dd><Price price={prepared.shippingTotal} currencyCode="brl" /></dd></div>
          <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2 font-semibold text-zinc-900"><dt>Total</dt><dd><Price price={prepared.total} currencyCode="brl" /></dd></div>
        </dl>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button type="button" variant="secondary" onClick={onBack}>Voltar</Button>
        <Button type="button" onClick={onNext}>
          Continuar para pagamento
        </Button>
      </div>
    </div>
  )
}

export default CheckoutPreparationStep
