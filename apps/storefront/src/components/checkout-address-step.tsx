import AddressForm from "@/components/address-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { useSetCartAddresses } from "@/lib/hooks/use-checkout"
import { useAuth } from "@/lib/hooks/use-auth"
import { sdk } from "@/lib/medusa"
import { AddressFormData } from "@/lib/types/global"
import { HttpTypes } from "@medusajs/types"
import type { CheckoutCustomerInfo } from "@/lib/payments/contracts"
import {
  isValidCnpj,
  isValidCpf,
  isValidEmail,
} from "@/lib/validation/checkout"
import { formatCNPJ, formatCPF } from "@/lib/utils/formatters"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { MapPin } from "@medusajs/icons"

interface CompanyAddressData {
  id: string
  name: string
  first_name: string
  last_name: string
  company_name: string | null
  address_1: string
  address_2: string | null
  city: string
  province: string | null
  postal_code: string
  country_code: string
  phone: string | null
  is_default_shipping: boolean
  is_default_billing: boolean
  is_billing_only: boolean
}

interface AddressStepProps {
  cart: HttpTypes.StoreCart;
  onNext: () => void;
  customerInfo?: CheckoutCustomerInfo
  onCustomerInfoChange?: (info: CheckoutCustomerInfo) => void
}

const CHECKOUT_COUNTRY_CODE = "br"
const CHECKOUT_PROVINCE = "SP"

function applyCompanyAddress(
  addr: CompanyAddressData,
  setter: React.Dispatch<React.SetStateAction<AddressFormData>>
) {
  setter({
    first_name: addr.first_name,
    last_name: addr.last_name,
    company: addr.company_name || "",
    address_1: addr.address_1,
    address_2: addr.address_2 || "",
    city: addr.city,
    postal_code: addr.postal_code,
    province: CHECKOUT_PROVINCE,
    country_code: CHECKOUT_COUNTRY_CODE,
    phone: addr.phone || "",
    number: "",
    neighborhood: "",
  })
}

const AddressStep = ({ cart, onNext, customerInfo = { personType: "individual", document: "", legalName: "", tradeName: "", firstName: "", lastName: "", email: "", phone: "" }, onCustomerInfoChange }: AddressStepProps) => {
  const setAddressesMutation = useSetCartAddresses()
  const { employee } = useAuth()
  const [sameAsBilling, setSameAsBilling] = useState(Boolean(cart.shipping_address))
  const [pickupOnly, setPickupOnly] = useState(cart.metadata?.frigga_fulfillment_mode === "pickup")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isShippingAddressValid, setIsShippingAddressValid] = useState(false)
  const [isBillingAddressValid, setIsBillingAddressValid] = useState(false)
  const [email, setEmail] = useState(cart.email || "")
  const [emailTouched, setEmailTouched] = useState(Boolean(cart.email))
  const [mutationError, setMutationError] = useState<string | null>(null)

  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null)
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null)

  const { data: companyAddresses = [] } = useQuery({
    queryKey: ["company-addresses"],
    queryFn: async () => {
      const response = await sdk.client.fetch<{ addresses: CompanyAddressData[] }>(
        "/store/company/addresses",
        { method: "GET" }
      )
      return response.addresses
    },
    enabled: !!employee,
  })

  const shippingAddresses = useMemo(
    () => companyAddresses.filter((a) => !a.is_billing_only),
    [companyAddresses]
  )
  const billingAddresses = companyAddresses
  const hasCompanyAddresses = shippingAddresses.length > 0 && !!employee
  const hasCompanyBillingAddresses = billingAddresses.length > 0 && !!employee

  const [shippingAddress, setShippingAddress] = useState<AddressFormData>({
    first_name: cart.shipping_address?.first_name || "",
    last_name: cart.shipping_address?.last_name || "",
    company: cart.shipping_address?.company || "",
    address_1: cart.shipping_address?.address_1 || "",
    address_2: cart.shipping_address?.address_2 || "",
    city: cart.shipping_address?.city || "",
    postal_code: cart.shipping_address?.postal_code || "",
    province: CHECKOUT_PROVINCE,
    country_code: CHECKOUT_COUNTRY_CODE,
    phone: cart.shipping_address?.phone || "",
    number: "",
    neighborhood: "",
  })
  const [billingAddress, setBillingAddress] = useState<AddressFormData>({
    first_name: cart.billing_address?.first_name || "",
    last_name: cart.billing_address?.last_name || "",
    company: cart.billing_address?.company || "",
    address_1: cart.billing_address?.address_1 || "",
    address_2: cart.billing_address?.address_2 || "",
    city: cart.billing_address?.city || "",
    postal_code: cart.billing_address?.postal_code || "",
    province: CHECKOUT_PROVINCE,
    country_code: CHECKOUT_COUNTRY_CODE,
    phone: cart.billing_address?.phone || "",
    number: "",
    neighborhood: "",
  })

  useEffect(() => {
    if (hasCompanyAddresses && !selectedShippingAddressId) {
      const defaultShipping = shippingAddresses.find((a) => a.is_default_shipping) || shippingAddresses[0]
      setSelectedShippingAddressId(defaultShipping.id)
      applyCompanyAddress(defaultShipping, setShippingAddress)
      setIsShippingAddressValid(true)
      if (sameAsBilling) {
        setSelectedBillingAddressId(defaultShipping.id)
      }
    }
    if (hasCompanyBillingAddresses && !selectedBillingAddressId && !sameAsBilling) {
      const defaultBilling = billingAddresses.find((a) => a.is_default_billing) || billingAddresses[0]
      setSelectedBillingAddressId(defaultBilling.id)
      applyCompanyAddress(defaultBilling, setBillingAddress)
      setIsBillingAddressValid(true)
    }
  }, [
    billingAddresses,
    hasCompanyAddresses,
    hasCompanyBillingAddresses,
    sameAsBilling,
    selectedBillingAddressId,
    selectedShippingAddressId,
    shippingAddresses,
  ])

  useEffect(() => {
    if (pickupOnly && sameAsBilling) setSameAsBilling(false)
  }, [pickupOnly, sameAsBilling])

  const handleSelectShippingAddress = (addr: CompanyAddressData) => {
    setSelectedShippingAddressId(addr.id)
    applyCompanyAddress(addr, setShippingAddress)
    setIsShippingAddressValid(true)
    if (sameAsBilling) {
      setSelectedBillingAddressId(addr.id)
    }
  }

  const handleSelectBillingAddress = (addr: CompanyAddressData) => {
    setSelectedBillingAddressId(addr.id)
    applyCompanyAddress(addr, setBillingAddress)
    setIsBillingAddressValid(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSubmitting) return

    setIsSubmitting(true)

    try {
      const submitData = new FormData()

      submitData.append("email", email)
      submitData.append("pickup_only", String(pickupOnly))

      const hasShippingAddress = !pickupOnly && Boolean(
        shippingAddress.address_1.trim() && shippingAddress.city.trim() && shippingAddress.postal_code.trim(),
      )
      const shippingData = {
        ...shippingAddress,
        address_2: [shippingAddress.number ? `Nº ${shippingAddress.number}` : "", shippingAddress.neighborhood, shippingAddress.address_2].filter(Boolean).join(", "),
      }
      if (hasShippingAddress) Object.entries(shippingData).filter(([key]) => !["number", "neighborhood"].includes(key)).forEach(([key, value]) => {
        submitData.append(`shipping_address.${key}`, value)
      })

      const billingData = sameAsBilling && hasShippingAddress ? shippingData : {
        ...billingAddress,
        address_2: [billingAddress.number ? `Nº ${billingAddress.number}` : "", billingAddress.neighborhood, billingAddress.address_2].filter(Boolean).join(", "),
      }
      Object.entries(billingData).filter(([key]) => !["number", "neighborhood"].includes(key)).forEach(([key, value]) => {
        submitData.append(`billing_address.${key}`, value)
      })

      await setAddressesMutation.mutateAsync(submitData)
      setMutationError(null)
      onNext()
    } catch (err: any) {
      setMutationError(err.message || "Failed to submit address. Please check the fields and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid = () => {
    const emailValid = isValidEmail(email)
    const documentValid = customerInfo.personType === "individual"
      ? isValidCpf(customerInfo.document)
      : isValidCnpj(customerInfo.document) && customerInfo.legalName.trim().length >= 2

    if (hasCompanyAddresses) {
      const billingValid = pickupOnly
        ? !!selectedBillingAddressId
        : sameAsBilling || !!selectedBillingAddressId
      return emailValid && documentValid && billingValid
    }

    return (
      emailValid && documentValid &&
      (pickupOnly ? isBillingAddressValid : isBillingAddressValid || (sameAsBilling && isShippingAddressValid))
    )
  }

  useEffect(() => {
    setShippingAddress((previous) => previous.country_code === CHECKOUT_COUNTRY_CODE ? previous : { ...previous, country_code: CHECKOUT_COUNTRY_CODE })
    setBillingAddress((previous) => previous.country_code === CHECKOUT_COUNTRY_CODE ? previous : { ...previous, country_code: CHECKOUT_COUNTRY_CODE })
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4" aria-labelledby="checkout-customer-type-title">
        <h3 id="checkout-customer-type-title" className="text-base font-semibold text-zinc-900">Dados do comprador</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-900">Tipo de pessoa
            <select value={customerInfo.personType} onChange={(event) => {
              const personType = event.target.value as CheckoutCustomerInfo["personType"]
              onCustomerInfoChange?.({ ...customerInfo, personType, document: "", legalName: personType === "business" ? customerInfo.legalName : "" })
            }} className="mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3">
              <option value="individual">Pessoa física</option><option value="business">Pessoa jurídica</option>
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-900" htmlFor="checkout-document">{customerInfo.personType === "individual" ? "CPF" : "CNPJ"}
            <Input id="checkout-document" type="text" value={customerInfo.document} onChange={(event) => onCustomerInfoChange?.({ ...customerInfo, document: customerInfo.personType === "individual" ? formatCPF(event.target.value) : formatCNPJ(event.target.value) })} className="mt-1" inputMode="numeric" autoComplete="off" aria-invalid={!((customerInfo.personType === "individual" ? isValidCpf : isValidCnpj)(customerInfo.document))} aria-describedby="checkout-document-help" />
            <span id="checkout-document-help" className="mt-1 block text-xs font-normal text-zinc-600">{customerInfo.personType === "individual" ? "Informe um CPF válido." : "Informe um CNPJ válido."}</span>
          </label>
        </div>
        {customerInfo.personType === "business" && <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium text-zinc-900" htmlFor="checkout-legal-name">Razão social<Input id="checkout-legal-name" value={customerInfo.legalName} onChange={(event) => onCustomerInfoChange?.({ ...customerInfo, legalName: event.target.value })} className="mt-1" /></label><label className="text-sm font-medium text-zinc-900" htmlFor="checkout-trade-name">Nome fantasia<Input id="checkout-trade-name" value={customerInfo.tradeName} onChange={(event) => onCustomerInfoChange?.({ ...customerInfo, tradeName: event.target.value })} className="mt-1" /></label></div>}
      </section>
      <div className="rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm leading-5 text-teal-950">
        Escolha retirada na loja ou informe um endereco em Sao Paulo. O frete sera calculado na proxima etapa.
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <label className="flex items-start gap-3 text-sm font-medium text-zinc-900" htmlFor="checkout-pickup-only">
            <input id="checkout-pickup-only" type="checkbox" checked={pickupOnly} onChange={(event) => { const checked = event.target.checked; setPickupOnly(checked); setSameAsBilling(!checked) }} className="mt-1 h-4 w-4" />
            <span><span className="block">Vou retirar na Loja 1</span><span className="mt-1 block text-xs font-normal text-zinc-600">Alameda Glete, 663 — Campos Elíseos, São Paulo/SP. O endereco de entrega nao sera exigido.</span></span>
          </label>
        </div>
        {/* Shipping Address */}
        {!pickupOnly && <div className="flex flex-col gap-2">
          <h3 className="text-zinc-900 !text-base font-semibold">
            Endereço de Entrega
          </h3>
          {hasCompanyAddresses ? (
            <CompanyAddressSelector
              addresses={shippingAddresses}
              selectedId={selectedShippingAddressId}
              onSelect={handleSelectShippingAddress}
            />
          ) : (
            <AddressForm
              addressFormData={shippingAddress}
              setAddressFormData={setShippingAddress}
              countries={cart.region?.countries}
              setIsFormValid={setIsShippingAddressValid}
              lockedCountryCode={CHECKOUT_COUNTRY_CODE}
              lockedProvince={CHECKOUT_PROVINCE}
            />
          )}
        </div>}

        {/* Pickup has no delivery address to copy into billing. */}
        {!pickupOnly && <div className="flex items-start gap-x-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
          <Checkbox
            id="same_as_billing"
            type="checkbox"
            checked={sameAsBilling}
            onChange={(e) => {
              const checked = !!e.target.checked
              setSameAsBilling(checked)
              if (checked && hasCompanyAddresses && selectedShippingAddressId) {
                setSelectedBillingAddressId(selectedShippingAddressId)
              }
            }}
          />
          <label htmlFor="same_as_billing" className="text-sm leading-5">
            O endereço de cobrança é o mesmo da entrega
          </label>
        </div>}

        {/* Billing Address (if different) */}
        {!sameAsBilling && (
          <div className="flex flex-col gap-2">
            <h3 className="text-zinc-900 !text-base font-semibold">
              {pickupOnly ? "Endereço de cobrança/fiscal" : "Endereço de Cobrança"}
            </h3>
            {hasCompanyBillingAddresses ? (
              <CompanyAddressSelector
                addresses={billingAddresses}
                selectedId={selectedBillingAddressId}
                onSelect={handleSelectBillingAddress}
              />
            ) : (
              <AddressForm
                addressFormData={billingAddress}
                setAddressFormData={setBillingAddress}
                countries={cart.region?.countries}
                setIsFormValid={setIsBillingAddressValid}
                lockedCountryCode={CHECKOUT_COUNTRY_CODE}
                lockedProvince={CHECKOUT_PROVINCE}
              />
            )}
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailTouched(true)
            }}
            onBlur={() => setEmailTouched(true)}
            placeholder="seu@email.com"
            className="w-full"
            aria-invalid={!!(emailTouched && (!email.trim() || !email.includes("@")))}
            aria-describedby={emailTouched && (!email.trim() || !email.includes("@")) ? "email-error" : "email-desc"}
          />
          <p id="email-desc" className="text-xs text-zinc-600">
            Você receberá atualizações do pedido neste email.
          </p>
          {emailTouched && (!email.trim() || !email.includes("@")) && (
            <p id="email-error" className="text-rose-900 text-sm mt-1" aria-live="polite">
              Por favor, insira um email válido.
            </p>
          )}
        </div>

        {mutationError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-md" aria-live="assertive">
            {mutationError}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-zinc-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-zinc-500">Voce podera confirmar a opcao de entrega antes de continuar.</p>
          <Button type="submit" disabled={!isFormValid() || isSubmitting} className="w-full motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] sm:w-auto">
            Próximo
          </Button>
        </div>
      </form>
    </div>
  )
}

function CompanyAddressSelector({
  addresses,
  selectedId,
  onSelect,
}: {
  addresses: CompanyAddressData[]
  selectedId: string | null
  onSelect: (addr: CompanyAddressData) => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-600">Selecione um endereço da empresa</p>
      {addresses.map((addr) => {
        const isSelected = selectedId === addr.id
        return (
          <button
            key={addr.id}
            type="button"
            onClick={() => onSelect(addr)}
            className={`w-full flex items-start gap-4 p-4 border rounded-lg transition-colors text-left ${
              isSelected
                ? "border-zinc-900 bg-zinc-50"
                : "border-zinc-200 hover:border-zinc-300"
            }`}
          >
            <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <MapPin className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900">{addr.name}</p>
              <p className="text-sm text-zinc-600 mt-0.5">
                {addr.first_name} {addr.last_name}
                {addr.company_name ? ` - ${addr.company_name}` : ""}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                {addr.address_1}
                {addr.address_2 ? `, ${addr.address_2}` : ""}
                , {addr.city}
                {addr.province ? `, ${addr.province}` : ""}
                {" "}{addr.postal_code}, {addr.country_code.toUpperCase()}
              </p>
            </div>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 ${
              isSelected ? "border-zinc-900" : "border-zinc-300"
            }`}>
              {isSelected && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
            </div>
          </button>
        )
      })}
    </div>
  )
}

export default AddressStep
