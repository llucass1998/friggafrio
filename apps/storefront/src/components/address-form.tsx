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
import { useCallback, useEffect, useMemo, useState } from "react"

type AddressData = HttpTypes.StoreCreateCustomerAddress | HttpTypes.StoreAddAddress | AddressFormData;

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
}: AddressFormProps) => {
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>(
    {}
  )

  // If country is locked, ensure the address form data has the locked country code
  useEffect(() => {
    if (lockedCountryCode && addressFormData.country_code !== lockedCountryCode) {
      setAddressFormData((prev: AddressData) => ({ ...prev, country_code: lockedCountryCode }))
    }
  }, [lockedCountryCode, addressFormData.country_code, setAddressFormData])

  const handleChange = (field: string, value: string) => {
    setAddressFormData((prev: AddressData) => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
    setTouchedFields((prev) => ({ ...prev, [field]: true }))
  }

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

    if (!addressFormData.first_name?.trim())
      newErrors.first_name = "Nome é obrigatório"
    if (!addressFormData.last_name?.trim())
      newErrors.last_name = "Sobrenome é obrigatório"
    if (!addressFormData.address_1?.trim())
      newErrors.address_1 = "Endereço é obrigatório"
    if (!addressFormData.city?.trim()) newErrors.city = "Cidade é obrigatória"
    if (!addressFormData.postal_code?.trim())
      newErrors.postal_code = "CEP é obrigatório"
    if (!addressFormData.country_code?.trim())
      newErrors.country_code = "País é obrigatório"
    const countryCodeExists = countriesInput.some(
      (country) => country.code === addressFormData.country_code
    )
    if (!countryCodeExists) newErrors.country_code = "País inválido"

    setErrors(newErrors)
    const isValid = Object.keys(newErrors).length === 0
    setIsFormValid?.(isValid)
    return isValid
  }, [addressFormData, countriesInput, setIsFormValid])

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
      {/* Name fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Company (Removido por ser B2B, reaproveitado field para Bairro no map do medusa se for preciso) */}

      {/* CEP */}
      <div className="flex flex-col gap-2">
        <label htmlFor="postal_code" className="block text-sm font-medium">
          CEP
        </label>
        <Input
          name="postal_code"
          id="postal_code"
          type="text"
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
      </div>

      {/* Address fields */}
      <div className="flex flex-col gap-2">
        <label htmlFor="address_1" className="block text-sm font-medium">
          Logradouro
        </label>
        <Input
          name="address_1"
          id="address_1"
          type="text"
          autoComplete="street-address"
          value={addressFormData.address_1 ?? ""}
          onChange={(e) => handleChange("address_1", e.target.value)}
          placeholder="Ex: Rua das Flores"
          aria-invalid={!!(errors.address_1 && touchedFields.address_1)}
          aria-describedby={errors.address_1 && touchedFields.address_1 ? "address_1-error" : undefined}
        />
        {errors.address_1 && touchedFields.address_1 && (
          <div id="address_1-error" className="text-rose-900 text-sm mt-1" aria-live="polite">{errors.address_1}</div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="address_2" className="block text-sm font-medium">
            Número
          </label>
          <Input
            name="address_2"
            id="address_2"
            type="text"
            value={addressFormData.address_2 ?? ""}
            onChange={(e) => handleChange("address_2", e.target.value)}
            placeholder="Ex: 123"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="province" className="block text-sm font-medium">
            Complemento
          </label>
          <Input
            name="province"
            id="province"
            type="text"
            value={addressFormData.province ?? ""}
            onChange={(e) => handleChange("province", e.target.value)}
            placeholder="Ex: Apto 42"
          />
        </div>
      </div>

      {/* City, Bairro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="company" className="block text-sm font-medium">
            Bairro
          </label>
          <Input
            name="company"
            id="company"
            type="text"
            value={addressFormData.company ?? ""}
            onChange={(e) => handleChange("company", e.target.value)}
            placeholder="Ex: Centro"
          />
        </div>
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
      </div>

      {/* Country */}
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
        />
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
