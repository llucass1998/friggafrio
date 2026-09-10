import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { Loader2, MapPin, Truck } from "lucide-react"
import { estimateShipping, type ShippingEstimateOption, type ShippingEstimateResponse } from "@/lib/data/shipping-estimate"
import { getStoredCart } from "@/lib/utils/cart"
import { formatCep, lookupCep, normalizeCep, readGuestCep, setGuestCep, subscribeGuestCep } from "@/lib/cep"
import { useAuth } from "@/lib/hooks/use-auth"
import { useSetCartShippingMethod } from "@/lib/hooks/use-checkout"
import { ShippingOptionCard, type ShippingEstimateOptionView } from "@/components/shipping-option-card"

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 8)
const formatPostalCode = formatCep

const reasonCopy: Record<string, string> = {
  ADDRESS_NOT_RESOLVABLE: "Informe endereco e cidade para localizar a entrega.",
  DELIVERY_UNAVAILABLE: "Entrega indisponivel para este endereco.",
  DELIVERY_PROVIDER_UNAVAILABLE: "Nao foi possivel consultar a rota agora.",
  CART_COMPLETED: "Este carrinho ja foi concluido.",
}

export function ShippingEstimate() {
  const [postalCode, setPostalCode] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState("")
  const [province, setProvince] = useState("SP")
  const [showAddressFields, setShowAddressFields] = useState(false)
  const [result, setResult] = useState<ShippingEstimateResponse | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCepLoading, setIsCepLoading] = useState(false)
  const [cepMessage, setCepMessage] = useState<string | null>(null)
  const lookupSequence = useRef(0)
  const lookupAddress = useRef("")
  const { customer } = useAuth()
  const setShippingMethod = useSetCartShippingMethod()
  const guestCep = useSyncExternalStore(subscribeGuestCep, readGuestCep, () => "")
  const customerAddress = customer?.addresses?.find((item) => item.id === customer.default_shipping_address_id) || customer?.addresses?.[0]
  const customerCep = customerAddress?.postal_code || ""

  useEffect(() => {
    setPostalCode(formatPostalCode(customer?.id ? customerCep : guestCep))
    if (customer?.id && customerAddress) {
      setAddress((current) => current || customerAddress.address_1 || "")
      setCity((current) => current || customerAddress.city || "")
      setProvince((current) => current !== "SP" ? current : (customerAddress.province || "SP").replace(/^br-/i, "").toUpperCase())
      setShowAddressFields(true)
    }
  }, [customer?.id, customerAddress, customerCep, guestCep])

  useEffect(() => {
    const normalized = normalizeCep(postalCode)
    if (normalized.length !== 8) {
      setCepMessage(null)
      return
    }
    const requestId = ++lookupSequence.current
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setIsCepLoading(true)
      setCepMessage(null)
      try {
        const resolved = await lookupCep(normalized, { signal: controller.signal })
        if (requestId !== lookupSequence.current) return
        if (!resolved) {
          setCepMessage("CEP nao encontrado. Preencha o endereco manualmente.")
          return
        }
        if (!address.trim() || address === lookupAddress.current) {
          setAddress(resolved.street)
          lookupAddress.current = resolved.street
        }
        if (!city.trim()) setCity(resolved.city)
        if (!province.trim() || province === "SP") setProvince(resolved.state || "SP")
        setShowAddressFields(true)
        setCepMessage("Endereco encontrado. Confirme ou ajuste o numero e os demais dados.")
      } catch (reason) {
        if (requestId === lookupSequence.current && !controller.signal.aborted) setCepMessage(reason instanceof Error ? "Nao foi possivel consultar o CEP. Preencha manualmente." : "Nao foi possivel consultar o CEP.")
      } finally {
        if (requestId === lookupSequence.current) setIsCepLoading(false)
      }
    }, 250)
    return () => {
      clearTimeout(timer)
      controller.abort()
      lookupSequence.current += 1
      setIsCepLoading(false)
    }
  }, [postalCode])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setResult(null)
    setSelectionError(null)
    setSelectedOptionId(null)

    if (digitsOnly(postalCode).length !== 8) {
      setError("Digite um CEP valido com 8 numeros.")
      return
    }
    if (!address.trim() || !city.trim()) {
      setShowAddressFields(true)
      setError("Informe endereco e cidade para calcular a entrega.")
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
      if (next.status === "unavailable" && next.reason) setError(reasonCopy[next.reason] || "Entrega indisponivel para este endereco.")
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Nao foi possivel calcular a entrega.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = async (option: ShippingEstimateOption) => {
    setSelectedOptionId(option.id)
    setSelectionError(null)
    if (!option.shipping_option_id) return
    try {
      await setShippingMethod.mutateAsync({ shipping_option_id: option.shipping_option_id })
    } catch {
      setSelectedOptionId(null)
      setSelectionError("Nao foi possivel selecionar esta modalidade. Atualize as opcoes e tente novamente.")
    }
  }

  return (
    <section className="mt-5 rounded-[10px] border border-[var(--color-border)] bg-[#f4f9fd] p-4" aria-labelledby="shipping-estimate-title">
      <div className="mb-3 flex items-start gap-3">
        <div className="mt-0.5 rounded-md bg-white p-2 text-[var(--color-primary)]"><Truck className="h-4 w-4" aria-hidden="true" /></div>
        <div>
          <h2 id="shipping-estimate-title" className="text-sm font-semibold text-[var(--color-navy)]">Calcule a entrega</h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">Informe seu CEP para verificar as opções disponíveis.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label htmlFor="shipping-estimate-postal-code" className="sr-only">CEP</label>
          <input id="shipping-estimate-postal-code" value={postalCode} onChange={(event) => setPostalCode(formatPostalCode(event.target.value))} inputMode="numeric" autoComplete="postal-code" placeholder="Digite seu CEP" className="min-h-11 w-full rounded-[9px] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
          <button type="submit" disabled={isLoading || isCepLoading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-wait disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]">
            {isLoading || isCepLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <MapPin className="h-4 w-4" aria-hidden="true" />}
            Calcular
          </button>
        </div>

        {showAddressFields && <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="sr-only" htmlFor="shipping-estimate-address">Endereco</label>
          <input id="shipping-estimate-address" value={address} onChange={(event) => setAddress(event.target.value)} autoComplete="street-address" placeholder="Endereco e numero" className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
          <label className="sr-only" htmlFor="shipping-estimate-city">Cidade</label>
          <input id="shipping-estimate-city" value={city} onChange={(event) => setCity(event.target.value)} autoComplete="address-level2" placeholder="Cidade" className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
          <label className="sr-only" htmlFor="shipping-estimate-province">Estado</label>
          <input id="shipping-estimate-province" value={province} onChange={(event) => setProvince(event.target.value.slice(0, 2).toUpperCase())} autoComplete="address-level1" placeholder="UF" maxLength={2} className="min-h-11 w-full rounded-md border border-[var(--color-border)] px-3 text-sm text-[var(--color-navy)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20" />
        </div>}
        {cepMessage && <p className="text-xs text-[var(--color-text-muted)]" role="status" aria-live="polite">{cepMessage}</p>}
      </form>

      {error && <p className="mt-3 text-sm text-rose-700" role="alert">{error}</p>}
      {result?.status === "ready" && result.options.length > 0 && <div className="mt-3 flex flex-col gap-3" aria-live="polite" role="radiogroup" aria-label="Opcoes de entrega">
        {result.options.map((option) => <ShippingOptionCard key={option.id} option={option as ShippingEstimateOptionView} selected={selectedOptionId === option.id} onSelect={() => void handleSelect(option)} disabled={setShippingMethod.isPending || !option.shipping_option_id} />)}
        {selectionError && <p className="text-sm text-rose-700" role="alert">{selectionError}</p>}
        <p className="text-xs leading-5 text-[var(--color-text-muted)]">Os prazos exibidos serao confirmados durante a finalizacao do pedido.</p>
      </div>}
    </section>
  )
}
