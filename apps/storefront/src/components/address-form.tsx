import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { countries } from "@/lib/constants/countries"
import { HttpTypes } from "@medusajs/types"
import { AddressFormData } from "@/lib/types/global"
import { clsx } from "clsx"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { formatCep, lookupCep, normalizeCep } from "@/lib/cep"
import {
  isValidBrazilPhone,
  isValidBrazilPostalCode,
  isValidPersonName,
  normalizeDigits,
  normalizePersonName,
} from "@/lib/validation/checkout"
import { formatPhone } from "@/lib/utils/formatters"

type AddressData = (HttpTypes.StoreCreateCustomerAddress | HttpTypes.StoreAddAddress | AddressFormData) & { number?: string; neighborhood?: string };

interface AddressFormProps {
  addressFormData: AddressData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setAddressFormData: React.Dispatch<React.SetStateAction<any>>;
  shouldHandleSubmit?: boolean;
  setIsFormValid?: (isValid: boolean) => void;
  onSubmit?:
    | ((address: HttpTypes.StoreCreateCustomerAddress) => void)
    | ((address: HttpTypes.StoreAddAddress) => void);
  onCancel?: () => void;
  countries?: HttpTypes.StoreRegion["countries"];
  isLoading?: boolean;
  className?: string;
  /** If provided, the country field will be pre-populated with this value and made readonly */
  lockedCountryCode?: string;
  /** Restricts checkout addresses to a specific state without affecting account forms. */
  lockedProvince?: string;
  /** Checkout already collects contact data in its first step. */
  showContactFields?: boolean;
}

const AddressForm = ({
  addressFormData,
  setAddressFormData,
  shouldHandleSubmit = false,
  setIsFormValid,
  onSubmit,
  onCancel,
  isLoading,
  countries: customCountries,
  className,
  lockedCountryCode,
  lockedProvince,
  showContactFields = true,
}: AddressFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  )
  const lookupSequence = useRef(0)
  const isCheckoutAddress = Boolean(lockedCountryCode)
  const [withoutNumber, setWithoutNumber] = useState(false)
  const [cepLookupError, setCepLookupError] = useState<string | null>(null)

  // If country is locked, ensure the address form data has the locked country code
  useEffect(() => {
    if (lockedCountryCode && addressFormData.country_code !== lockedCountryCode) {
      setAddressFormData((prev: AddressData) => ({ ...prev, country_code: lockedCountryCode }))
    }
  }, [lockedCountryCode, addressFormData.country_code, setAddressFormData])

  useEffect(() => {
    if (lockedProvince && addressFormData.province !== lockedProvince) {
      setAddressFormData((prev: AddressData) => ({ ...prev, province: lockedProvince }))
    }
  }, [lockedProvince, addressFormData.province, setAddressFormData])

  const handleChange = (field: string, value: string) => {
    if (field === "postal_code") value = formatCep(value)
    if (field === "phone") value = formatPhone(value)
    if (field === "number") value = normalizeDigits(value, 10)
    if (field === "first_name" || field === "last_name") value = normalizePersonName(value)
    setAddressFormData((prev: AddressData) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }

  useEffect(() => {
    const cep = normalizeCep(String(addressFormData.postal_code ?? ""))
    setCepLookupError(null)
    if (cep.length !== 8) return
    const sequence = ++lookupSequence.current
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const result = await lookupCep(cep, { signal: controller.signal })
        if (sequence !== lookupSequence.current) return
        if (!result) {
          setCepLookupError("Não encontramos esse CEP. Confira ou preencha manualmente.")
          return
        }
        setAddressFormData((previous: AddressData) => ({
          ...previous,
          address_1: touchedFields.address_1 ? previous.address_1 : result.street,
          city: touchedFields.city ? previous.city : result.city,
          province: touchedFields.province ? previous.province : result.state,
          neighborhood: touchedFields.neighborhood ? previous.neighborhood : result.neighborhood,
        }))
        if (isCheckoutAddress && !touchedFields.number) document.getElementById("address_number")?.focus()
      } catch (error) {
        if (sequence !== lookupSequence.current || (error instanceof DOMException && error.name === "AbortError")) return
        // Manual entry remains available when the lookup provider is unavailable.
        setCepLookupError("Não foi possível consultar o CEP. Você pode preencher manualmente.")
      }
    }, 350)
    return () => { clearTimeout(timer); controller.abort() }
  }, [addressFormData.postal_code, isCheckoutAddress, setAddressFormData, touchedFields])

  const countriesInput = useMemo(() => {
    if (!customCountries) {
      return countries
    }

    return customCountries.map((country) => ({
      code: country.iso_2 || "",
      name: country.display_name || "",
    }))
  }, [customCountries])

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (showContactFields && !isValidPersonName(addressFormData.first_name ?? ""))
      newErrors.first_name = "Informe um nome válido"
    if (showContactFields && !isValidPersonName(addressFormData.last_name ?? ""))
      newErrors.last_name = "Informe um sobrenome válido"
    if (!addressFormData.address_1?.trim())
      newErrors.address_1 = "Endereço é obrigatório"
    if (!addressFormData.city?.trim()) newErrors.city = "Cidade é obrigatória"
    if (!isValidBrazilPostalCode(addressFormData.postal_code ?? ""))
      newErrors.postal_code = "Informe um CEP válido"
    if (isCheckoutAddress && !withoutNumber && !normalizeDigits(addressFormData.number ?? ""))
      newErrors.number = "Informe o número ou marque sem número"
    if (showContactFields && !isValidBrazilPhone(addressFormData.phone ?? ""))
      newErrors.phone = "Informe um telefone válido com DDD"
    if (!addressFormData.country_code?.trim())
      newErrors.country_code = "País é obrigatório"
    const countryCodeExists = lockedCountryCode
      ? addressFormData.country_code?.toLowerCase() === lockedCountryCode.toLowerCase()
      : countriesInput.some((country) => country.code === addressFormData.country_code)
    if (!countryCodeExists) newErrors.country_code = "País inválido"

    if (lockedProvince && addressFormData.province?.toLowerCase() !== lockedProvince.toLowerCase()) {
      newErrors.province = "Estado invalido"
    }

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    setIsFormValid?.(isValid)
    return isValid
  }, [addressFormData, countriesInput, isCheckoutAddress, lockedCountryCode, lockedProvince, setIsFormValid, showContactFields, withoutNumber])

  useEffect(() => {
    validateForm()
  }, [validateForm])

  const handleSubmit = () => {
    if (!validateForm() || !shouldHandleSubmit) return

    if (onSubmit) {
      onSubmit(addressFormData as HttpTypes.StoreCreateCustomerAddress & HttpTypes.StoreAddAddress)
    }
  }

  return (
    <div className={clsx("space-y-4", className)}>
      {/* Contact data is collected once in the first checkout step. */}
      {showContactFields && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="first_name" className="block text-sm font-medium">
            Nome
          </label>
          <Input
            name="first_name"
            id="first_name"
            type="text"
            autoComplete="given-name"
            value={addressFormData.first_name ?? ""}
            onChange={(e) => handleChange("first_name", e.target.value)}
            placeholder="Nome"
            aria-invalid={!!(errors.first_name && touchedFields.first_name)}
            aria-describedby={errors.first_name && touchedFields.first_name ? "first_name-error" : undefined}
          />
          {errors.first_name && touchedFields.first_name && (
            <div id="first_name-error" className="text-rose-900 text-sm mt-1" aria-live="polite">
              {errors.first_name}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="last_name" className="block text-sm font-medium">
            Sobrenome
          </label>
          <Input
            name="last_name"
            id="last_name"
            type="text"
            autoComplete="family-name"
            value={addressFormData.last_name ?? ""}
            onChange={(e) => handleChange("last_name", e.target.value)}
            placeholder="Sobrenome"
            aria-invalid={!!(errors.last_name && touchedFields.last_name)}
            aria-describedby={errors.last_name && touchedFields.last_name ? "last_name-error" : undefined}
          />
          {errors.last_name && touchedFields.last_name && (
            <div id="last_name-error" className="text-rose-900 text-sm mt-1" aria-live="polite">
              {errors.last_name}
            </div>
          )}
        </div>
      </div>}

      {/* Company */}
      {showContactFields && <div className="flex flex-col gap-2">
        <label htmlFor="company" className="block text-sm font-medium">
          Empresa
        </label>
        <Input
          name="company"
          id="company"
          type="text"
          autoComplete="organization"
          value={addressFormData.company ?? ""}
          onChange={(e) => handleChange("company", e.target.value)}
          placeholder="Nome da empresa (opcional)"
        />
      </div>}

      {/* CEP */}
      <div className="flex flex-col gap-2">
        <label htmlFor="postal_code" className="block text-sm font-medium">
          CEP
        </label>
        <Input
          name="postal_code"
          id="postal_code"
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          value={addressFormData.postal_code ?? ""}
          onChange={(e) => handleChange("postal_code", e.target.value)}
          placeholder="00000-000"
          aria-invalid={!!(errors.postal_code && touchedFields.postal_code)}
          aria-describedby={errors.postal_code && touchedFields.postal_code ? "postal_code-error" : undefined}
        />
        {errors.postal_code && touchedFields.postal_code && (
          <div id="postal_code-error" className="text-rose-900 text-sm mt-1" aria-live="polite">
            {errors.postal_code}
          </div>
        )}
        {cepLookupError && <p className="text-rose-900 text-sm" role="status" aria-live="polite">{cepLookupError}</p>}
      </div>

      {/* Address fields */}
      <div className="flex flex-col gap-2">
        <label htmlFor="address_1" className="block text-sm font-medium">
          {isCheckoutAddress ? "Logradouro" : "Endereço e Número"}
        </label>
        <Input
          name="address_1"
          id="address_1"
          type="text"
          autoComplete="street-address"
          value={addressFormData.address_1 ?? ""}
          onChange={(e) => handleChange("address_1", e.target.value)}
          placeholder={isCheckoutAddress ? "Rua das Flores" : "Ex: Rua das Flores, 123"}
          aria-invalid={!!(errors.address_1 && touchedFields.address_1)}
          aria-describedby={errors.address_1 && touchedFields.address_1 ? "address_1-error" : undefined}
        />
        {errors.address_1 && touchedFields.address_1 && (
          <div id="address_1-error" className="text-rose-900 text-sm mt-1" aria-live="polite">{errors.address_1}</div>
        )}
      </div>

      {isCheckoutAddress && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2"><label htmlFor="address_number" className="block text-sm font-medium">Número</label><Input name="address_number" id="address_number" value={withoutNumber ? "" : addressFormData.number ?? ""} onChange={(e) => handleChange("number", e.target.value)} autoComplete="address-line2" inputMode="numeric" placeholder="Número" disabled={withoutNumber} aria-invalid={!!(errors.number && touchedFields.number)} aria-describedby={errors.number && touchedFields.number ? "address_number-error" : undefined} />{errors.number && touchedFields.number && <p id="address_number-error" className="text-sm text-rose-900" aria-live="polite">{errors.number}</p>}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={withoutNumber} onChange={(event) => { const checked = event.target.checked; setWithoutNumber(checked); if (checked) handleChange("number", "") }} />Endereço sem número</label></div>
        <div className="flex flex-col gap-2"><label htmlFor="neighborhood" className="block text-sm font-medium">Bairro</label><Input name="neighborhood" id="neighborhood" value={addressFormData.neighborhood ?? ""} onChange={(e) => handleChange("neighborhood", e.target.value)} autoComplete="address-level3" placeholder="Bairro" /></div>
      </div>}

      <div className="flex flex-col gap-2">
        <label htmlFor="address_2" className="block text-sm font-medium">
          {isCheckoutAddress ? "Complemento" : "Complemento / Bairro"}
        </label>
        <Input
          name="address_2"
          id="address_2"
          type="text"
          value={addressFormData.address_2 ?? ""}
          onChange={(e) => handleChange("address_2", e.target.value)}
          placeholder="Ex: Apto 42, Centro"
        />
      </div>

      {/* City, Province */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="city" className="block text-sm font-medium">
            Cidade
          </label>
          <Input
            name="city"
            id="city"
            type="text"
            autoComplete="address-level2"
            value={addressFormData.city ?? ""}
            onChange={(e) => handleChange("city", e.target.value)}
            placeholder="Cidade"
            aria-invalid={!!(errors.city && touchedFields.city)}
            aria-describedby={errors.city && touchedFields.city ? "city-error" : undefined}
          />
          {errors.city && touchedFields.city && (
            <div id="city-error" className="text-rose-900 text-sm mt-1" aria-live="polite">{errors.city}</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="province" className="block text-sm font-medium">
            Estado
          </label>
          <Input
            name="province"
            id="province"
            type="text"
            autoComplete="address-level1"
            value={addressFormData.province ?? ""}
            onChange={(e) => handleChange("province", e.target.value)}
            placeholder="Ex: SP"
            readOnly={!!lockedProvince}
            aria-readonly={!!lockedProvince}
            className={lockedProvince ? "bg-zinc-50 text-zinc-700" : undefined}
          />
          {lockedProvince && <p className="text-xs text-zinc-500">Entregas disponiveis somente em Sao Paulo.</p>}
        </div>
      </div>

      {!lockedCountryCode && (
      <div className="flex flex-col gap-2">
        <label
          htmlFor="country_code"
          className="block text-sm font-medium text-zinc-900 mb-2"
        >
          País
        </label>
        {lockedCountryCode ? (
          <Input
            name="country_code"
            id="country_code"
            type="text"
            value={countriesInput.find(c => c.code === lockedCountryCode)?.name || lockedCountryCode.toUpperCase()}
            disabled
            className="bg-zinc-100 cursor-not-allowed"
          />
        ) : (
          <Select
            name="country_code"
            value={addressFormData.country_code ?? ""}
            onValueChange={(value) => handleChange("country_code", value)}
          >
            <SelectTrigger
              className="!border-zinc-200 !rounded-none !text-base !font-medium !px-4 !py-2 !h-auto !shadow-none !ring-0 focus:!ring-0"
              aria-invalid={!!(errors.country_code && touchedFields.country_code)}
              aria-describedby={errors.country_code && touchedFields.country_code ? "country_code-error" : undefined}
            >
              <SelectValue placeholder="Selecione o país" />
            </SelectTrigger>
            <SelectContent>
              {countriesInput.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.country_code && touchedFields.country_code && (
          <div id="country_code-error" className="text-rose-900 text-sm mt-1" aria-live="polite">
            {errors.country_code}
          </div>
        )}
      </div>
      )}

      {/* Phone */}
      <div className="flex flex-col gap-2">
        <label htmlFor="phone" className="block text-sm font-medium">
          Telefone
        </label>
        <Input
          name="phone"
          id="phone"
          type="tel"
          autoComplete="tel"
          value={addressFormData.phone ?? ""}
          onChange={(e) => handleChange("phone", e.target.value)}
          placeholder="Telefone (com DDD)"
          inputMode="tel"
          aria-invalid={!!(errors.phone && touchedFields.phone)}
          aria-describedby={errors.phone && touchedFields.phone ? "phone-error" : undefined}
        />
        {errors.phone && touchedFields.phone && <div id="phone-error" className="text-rose-900 text-sm" aria-live="polite">{errors.phone}</div>}
      </div>

      {/* Action buttons */}
      {shouldHandleSubmit && (
        <div className="flex items-center justify-end gap-x-4 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading} variant="primary">
            Salvar
          </Button>
        </div>
      )}
    </div>
  )
}

export default AddressForm
