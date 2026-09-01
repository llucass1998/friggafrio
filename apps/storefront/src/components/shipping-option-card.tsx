import { formatCurrencyAmount } from "@/lib/utils/currency"

export type ShippingEstimateOptionView = {
  id: string
  shipping_option_id?: string | null
  name: string
  amount: number
  currency_code: string
  delivery_estimate: string
  estimated_date?: string
  modality?: "pickup" | "motoboy" | "car"
  vehicle?: string
  distance_km?: number
  available: boolean
  reason?: string
}

const presentationFor = (option: ShippingEstimateOptionView) => {
  const express = option.modality === "motoboy" || /express|motoboy/i.test(option.name)
  const pickup = option.modality === "pickup" || /retirada/i.test(option.name)
  return {
    title: pickup
      ? "Retirada na Loja 1"
      : express
        ? "Motoboy — indisponível temporariamente"
        : "Carro FriggaFrio",
    carrier: pickup ? "FriggaFrio Loja 1" : express ? "Motoboy" : "Entrega pela equipe FriggaFrio",
  }
}

export function ShippingOptionCard({ option, selected, onSelect, disabled = false }: { option: ShippingEstimateOptionView; selected: boolean; onSelect: () => void; disabled?: boolean }) {
  const presentation = presentationFor(option)
  const price = !option.available
    ? "Indisponível"
    : option.amount === 0
    ? "Grátis"
    : formatCurrencyAmount({ amount: option.amount, currencyCode: option.currency_code })

  return (
    <label className={`block rounded-xl border p-4 transition-colors ${selected ? "border-[var(--color-primary)] bg-[#edf5ff]" : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary)]/50"} ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <input type="radio" name="pdp-shipping-option" checked={selected} onChange={onSelect} disabled={disabled} className="sr-only" />
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[var(--color-primary)]" : "border-slate-300"}`}>
          {selected && <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--color-navy)]">{presentation.title}</p>
          <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">{presentation.carrier}</p>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{option.delivery_estimate}</p>
          {!option.available && option.reason && <p className="mt-2 text-sm font-medium text-red-800" role="status">{option.reason}</p>}
          {option.estimated_date && <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">Data da rota: {option.estimated_date}</p>}
          {typeof option.distance_km === "number" && <p className="mt-1 text-xs text-[var(--color-text-muted)]">Distância: {option.distance_km.toFixed(1)} km</p>}
        </div>
        <p className="shrink-0 text-right text-base font-bold text-[var(--color-navy)]">{price}</p>
      </div>
    </label>
  )
}
