import { Price } from "@/components/ui/price"
import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import { HttpTypes } from "@medusajs/types"

interface CheckoutSummaryProps {
  cart: HttpTypes.StoreCart
  prepared?: CheckoutPreparedSummary | null
}

const CheckoutSummary = ({ cart, prepared }: CheckoutSummaryProps) => {
  if (!prepared || prepared.cartId !== cart.id) {
    return (
      <div className="h-fit sticky lg:top-20 rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600" role="status">
        Os valores finais serao confirmados pelo servidor antes de liberar o pagamento.
      </div>
    )
  }

  return (
    <div className="h-fit sticky lg:top-20">
      <div className="flex flex-col gap-6">
        <div className="space-y-3">
          {prepared.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-zinc-700">{item.title} x{item.quantity}</span>
              <Price price={item.lineTotal} currencyCode="brl" className="shrink-0 text-zinc-900" />
            </div>
          ))}
        </div>
        <dl className="space-y-2 border-t border-zinc-200 pt-4 text-sm text-zinc-700">
          <div className="flex justify-between gap-4"><dt>Subtotal</dt><dd><Price price={prepared.subtotal} currencyCode="brl" /></dd></div>
          <div className="flex justify-between gap-4"><dt>Entrega</dt><dd><Price price={prepared.shippingTotal} currencyCode="brl" /></dd></div>
          <div className="flex justify-between gap-4 border-t border-zinc-200 pt-2 text-base font-semibold text-zinc-900"><dt>Total</dt><dd><Price price={prepared.total} currencyCode="brl" /></dd></div>
        </dl>
      </div>
    </div>
  )
}

export default CheckoutSummary
