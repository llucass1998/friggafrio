import { Button } from "@/components/ui/button"
import { ShippingOptionCard, type ShippingEstimateOptionView } from "@/components/shipping-option-card"
import { type ShippingEstimateOption, visibleShippingPlaceholders } from "@/lib/data/shipping-estimate"
import { useSetCartAddresses, useSetCartShippingMethod, useShippingOptions } from "@/lib/hooks/use-checkout"
import { useAuth } from "@/lib/hooks/use-auth"
import AddressForm from "@/components/address-form"
import type { AddressFormData } from "@/lib/types/global"
import type { CheckoutCustomerInfo } from "@/lib/payments/contracts"
import type { HttpTypes } from "@medusajs/types"
import { useEffect, useState } from "react"

type DeliveryStepProps = {
  cart: HttpTypes.StoreCart
  onNext: () => void
  onBack: () => void
  resetSelectionToken?: number
  customerInfo?: CheckoutCustomerInfo
}

const modalityOrder: Record<NonNullable<ShippingEstimateOption["modality"]>, number> = {
  pickup: 0,
  car: 1,
  motoboy: 2,
}

const orderOptions = (options: ShippingEstimateOption[]) => [...options].sort((left, right) =>
  modalityOrder[left.modality ?? "motoboy"] - modalityOrder[right.modality ?? "motoboy"],
)

export default function DeliveryStep({ cart, onNext, onBack, resetSelectionToken = 0, customerInfo }: DeliveryStepProps) {
  const { customer } = useAuth()
  const savedAddress = customer?.addresses?.find((item) => item.id === customer.default_shipping_address_id) || customer?.addresses?.[0]
  const [options, setOptions] = useState<ShippingEstimateOption[]>(() => visibleShippingPlaceholders())
  const [selected, setSelected] = useState<string>(cart.shipping_methods?.[0]?.shipping_option_id || "")
  const [loading] = useState(false)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const setShippingMethod = useSetCartShippingMethod()
  const setAddresses = useSetCartAddresses()
  const [addressValid, setAddressValid] = useState(Boolean(cart.shipping_address || savedAddress))
  const [address, setAddress] = useState<AddressFormData>({
    first_name: customerInfo?.firstName || cart.shipping_address?.first_name || savedAddress?.first_name || "",
    last_name: customerInfo?.lastName || cart.shipping_address?.last_name || savedAddress?.last_name || "",
    company: cart.shipping_address?.company || savedAddress?.company || "",
    address_1: cart.shipping_address?.address_1 || savedAddress?.address_1 || "",
    address_2: cart.shipping_address?.address_2 || savedAddress?.address_2 || "",
    city: cart.shipping_address?.city || savedAddress?.city || "",
    postal_code: cart.shipping_address?.postal_code || savedAddress?.postal_code || "",
    province: cart.shipping_address?.province || savedAddress?.province || "SP",
    country_code: "br",
    phone: customerInfo?.phone || cart.shipping_address?.phone || savedAddress?.phone || "",
    number: "",
    neighborhood: "",
  })
  const selectedOption = options.find((option) => option.id === selected)
  const isPickup = selectedOption?.modality === "pickup"
  const requiresAddress = selectedOption?.modality === "car" || selectedOption?.modality === "motoboy"
  const { data: cartShippingOptions, refetch: refetchShippingOptions } = useShippingOptions({ cart_id: cart.id })
  const pickupShippingOptionId = cartShippingOptions?.find((option) =>
    option.data?.commercial_shipping_option === "FRIGGAFRIO_PICKUP_STORE_1",
  )?.id
  const carShippingOption = cartShippingOptions?.find((option) =>
    option.data?.commercial_shipping_option === "FRIGGAFRIO_CAR_CENTRAL"
    || /carro\s+friggafrio|entrega normal/i.test(option.name || ""),
  )
  const motoboyShippingOption = cartShippingOptions?.find((option) =>
    (typeof option.data?.commercial_shipping_option === "string" && option.data.commercial_shipping_option.startsWith("FRIGGAFRIO_EXPRESS_"))
    || /entrega expressa|motoboy/i.test(option.name || ""),
  )

  useEffect(() => {
    setSelected("")
    setOptions(orderOptions(visibleShippingPlaceholders(undefined, pickupShippingOptionId).map((option) => {
      if (option.modality === "car") {
        const hasAddress = Boolean(cart.shipping_address?.postal_code)
        return {
          ...option,
          shipping_option_id: carShippingOption?.id,
          amount: typeof carShippingOption?.amount === "number" ? carShippingOption.amount : option.amount,
          // The card stays actionable so the customer can enter the address once.
          // Its server-owned option is selected only after the address update.
          available: true,
          reason: hasAddress && !carShippingOption ? "Esta modalidade ainda não está disponível para este endereço." : "Informe o CEP para consultar disponibilidade e preço.",
        }
      }
      if (option.modality === "motoboy") {
        const hasAddress = Boolean(cart.shipping_address?.postal_code)
        if (motoboyShippingOption) {
          return {
            ...option,
            shipping_option_id: motoboyShippingOption.id,
            amount: typeof motoboyShippingOption.amount === "number" ? motoboyShippingOption.amount : option.amount,
            available: true,
            reason: undefined,
          }
        }
        return {
          ...option,
          available: false,
          reason: hasAddress
            ? "Esta modalidade expressa não está disponível para este endereço (atendimento até 100 km da loja)."
            : "Informe o endereço de entrega para consultar a disponibilidade e valor da entrega expressa.",
        }
      }
      return option
    })))
  }, [carShippingOption, motoboyShippingOption, cart.shipping_address?.postal_code, pickupShippingOptionId, resetSelectionToken])

  const submit = async () => {
    const option = options.find((item) => item.id === selected)
    if (!option?.available || (option.modality !== "car" && !option.shipping_option_id) || setShippingMethod.isPending || loading) {
      setMutationError("Escolha uma modalidade disponivel e tente novamente.")
      return
    }
    setMutationError(null)
    try {
      if (requiresAddress && !addressValid) {
        setMutationError("Preencha o endereço de entrega para continuar.")
        return
      }
      let selectedShippingOptionId = option.shipping_option_id
      if (requiresAddress) {
        const data = new FormData()
        data.append("email", customerInfo?.email || cart.email || "")
        data.append("pickup_only", "false")
        const normalized = { ...address, address_2: [address.number ? `Nº ${address.number}` : "", address.neighborhood, address.address_2].filter(Boolean).join(", ") }
        Object.entries(normalized).filter(([key]) => !["number", "neighborhood"].includes(key)).forEach(([key, value]) => data.append(`shipping_address.${key}`, String(value ?? "")))
        Object.entries(normalized).filter(([key]) => !["number", "neighborhood"].includes(key)).forEach(([key, value]) => data.append(`billing_address.${key}`, String(value ?? "")))
        await setAddresses.mutateAsync(data)
        const refreshed = await refetchShippingOptions()
        let matchingOption = null
        if (option.modality === "car") {
          matchingOption = refreshed.data?.find((item) => item.data?.commercial_shipping_option === "FRIGGAFRIO_CAR_CENTRAL" || /carro\s+friggafrio|entrega normal/i.test(item.name || ""))
        } else if (option.modality === "motoboy") {
          matchingOption = refreshed.data?.find((item) => (typeof item.data?.commercial_shipping_option === "string" && item.data.commercial_shipping_option.startsWith("FRIGGAFRIO_EXPRESS_")) || /entrega expressa|motoboy/i.test(item.name || ""))
        } else {
          matchingOption = refreshed.data?.find((item) => item.id === option.shipping_option_id)
        }
        selectedShippingOptionId = matchingOption?.id || option.shipping_option_id
        if (!selectedShippingOptionId) {
          setMutationError("Esta modalidade de entrega não está disponível para o endereço informado.")
          return
        }
      } else if (isPickup) {
        const data = new FormData()
        data.append("email", customerInfo?.email || cart.email || "")
        data.append("pickup_only", "true")
        await setAddresses.mutateAsync(data)
      }
      await setShippingMethod.mutateAsync({ shipping_option_id: selectedShippingOptionId! })
      onNext()
    } catch (reason) {
      setSelected("")
      const message = reason instanceof Error ? reason.message : ""
      const safeMessage = /invalid request|expected type|medusa|billing_address|shipping_address|null/i.test(message)
        ? "Nao foi possivel atualizar a entrega. Confira os dados e tente novamente."
        : message || "Nao foi possivel selecionar esta modalidade."
      setMutationError(safeMessage)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-teal-100 bg-teal-50 p-4 text-sm text-teal-950" role="status">
        As opcoes, valores e prazos sao confirmados pelo servidor. A retirada na Loja 1 permanece gratuita.
      </div>
      {loading && <p className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700" role="status" aria-live="polite">Calculando entrega...</p>}
      {!loading && options.length === 0 && <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">Informe um CEP valido para consultar as modalidades.</p>}
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Modalidades de entrega">
        {options.map((option) => (
          <ShippingOptionCard
            key={option.id}
            option={option as ShippingEstimateOptionView}
            selected={selected === option.id}
            onSelect={() => setSelected(option.id)}
            disabled={!option.available || (option.modality !== "car" && !option.shipping_option_id)}
          />
        ))}
      </div>
      {requiresAddress && <section className="rounded-xl border border-[var(--color-border)] bg-white p-4" aria-labelledby="delivery-address-title">
        <h3 id="delivery-address-title" className="mb-4 text-base font-semibold text-[var(--color-navy)]">Endereço de entrega</h3>
        <AddressForm addressFormData={address} setAddressFormData={setAddress} countries={cart.region?.countries} setIsFormValid={setAddressValid} lockedCountryCode="br" lockedProvince="SP" showContactFields={false} />
      </section>}
      {mutationError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">{mutationError}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" variant="secondary" onClick={onBack} disabled={setShippingMethod.isPending}>Voltar</Button>
        <Button type="button" onClick={() => void submit()} disabled={!selected || setShippingMethod.isPending || loading}>Próximo</Button>
      </div>
    </div>
  )
}
