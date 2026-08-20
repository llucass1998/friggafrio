import { useEffect, useState, useSyncExternalStore } from "react"
import { Loader2, MapPin, Truck } from "lucide-react"
import { formatCurrencyAmount } from "@/lib/utils/currency"
import { estimateShipping, type ShippingEstimateResponse } from "@/lib/data/shipping-estimate"
import { getStoredCart } from "@/lib/utils/cart"
import { formatCep, readGuestCep, setGuestCep, subscribeGuestCep } from "@/lib/cep"
import { useAuth } from "@/lib/hooks/use-auth"

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 8)
const formatPostalCode = formatCep

const reasonCopy: Record<string, string> = {
  ADDRESS_NOT_RESOLVABLE: "Informe endereço e cidade para localizar a entrega.",
  DELIVERY_UNAVAILABLE: "Entrega indisponível para este endereço.",
  DELIVERY_PROVIDER_UNAVAILABLE: "Não foi possível consultar a rota agora.",
  CART_COMPLETED: "Este carrinho já foi concluído.",
}

export function ShippingEstimate() {
  const [postalCode, setPostalCode] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const province = "SP"
  const [result, setResult] = useState<ShippingEstimateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { customer } = useAuth()
  const guestCep = useSyncExternalStore(subscribeGuestCep, readGuestCep, () => "")
  const customerCep = customer?.addresses?.find((address) => address.id === customer.default_shipping_address_id)?.postal_code || customer?.addresses?.[0]?.postal_code || ""

  useEffect(() => {
    setPostalCode(formatPostalCode(customer?.id ? customerCep : guestCep))
  }, [customer?.id, customerCep, guestCep])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResult(null)
    if (digitsOnly(postalCode).length !== 8) {
      setError("Digite um CEP válido com 8 números.")
      return
    }
    if (!address.trim() || !city.trim()) {
      setError("Informe endereço e cidade para calcular a entrega.")
      return
    }

    const normalizedPostalCode = formatPostalCode(postalCode)
    if (!customer?.id) setGuestCep(normalizedPostalCode)

    setIsLoading(true)
    try {
      const next = await estimateShipping({
        cart_id: getStoredCart(),
        postal_code: normalizedPostalCode,
        address_1: address.trim(),
        city: city.trim(),
        province: province.trim() || "SP",
        country_code: "br",
      })
      setResult(next)
      if (next.status === "unavailable" && next.reason) setError(reasonCopy[next.reason] || "Entrega indisponível para este endereço.")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Não foi possível calcular a entrega.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className="mt-5 border-t border-[var(--color-border)] pt-5" aria-labelledby="shipping-estimate-title">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-[var(--color-surface-soft)] p-2 text-[var(--color-primary)]">
          <Truck className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <h2 id="shipping-estimate-title" className="text-sm font-semibold text-[var(--color-navy)]">Calcule a entrega</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Use um endereço real para consultar prazo e valor no servidor.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <div>
          <label htmlFor="shipping-estimate-postal-code" className="sr-only">CEP</label>
          <input
            id="shipping-estimate-postal-code"
            value={postalCode}
            onChange={(event) => setPostalCode(formatPostalCode(event.target.value))}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="CEP 00000-000"
            className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
        </div>
        <div>
          <label htmlFor="shipping-estimate-address" className="sr-only">Endereço</label>
          <input
            id="shipping-estimate-address"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            autoComplete="street-address"
            placeholder="Endereço e número"
            className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
        </div>
        <button type="submit" disabled={isLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
          Calcular
        </button>
        <div className="sm:col-span-2">
          <label htmlFor="shipping-estimate-city" className="sr-only">Cidade</label>
          <input
            id="shipping-estimate-city"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2"
            placeholder="Cidade"
            className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
          />
        </div>
      </form>

      {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
      {result?.status === "ready" && result.options.length > 0 && (
        <div className="mt-3 grid gap-2" aria-live="polite">
          {result.options.map((option) => (
            <div key={option.id} className="flex items-start justify-between gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-soft)] px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-[var(--color-navy)]">{option.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{option.delivery_estimate}</p>
              </div>
              <p className="shrink-0 text-sm font-bold text-[var(--color-primary)]">
                {option.amount === 0 ? "Gratis" : formatCurrencyAmount({ amount: option.amount, currencyCode: option.currency_code })}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
