import ShippingItemSelector from "@/components/shipping-item-selector"
import { Button } from "@/components/ui/button"
import {
  useSetCartShippingMethod,
  useShippingOptions,
} from "@/lib/hooks/use-checkout"
import {
  getShippingOptionsViewState,
  hasShippingOption,
  isShippingOptionSelectable,
  type ShippingOptionAvailability,
  type ShippingOptionCalculationState,
} from "@/lib/utils/shipping-state"
import { HttpTypes } from "@medusajs/types"
import { useCallback, useEffect, useRef, useState } from "react"

interface DeliveryStepProps {
  cart: HttpTypes.StoreCart;
  onNext: () => void;
  onBack: () => void;
}

const DeliveryStep = ({ cart, onNext, onBack }: DeliveryStepProps) => {
  const {
    data: shippingOptions = [],
    isLoading: shippingOptionsLoading,
    isError: shippingOptionsError,
    error: shippingOptionsQueryError,
    refetch: refetchShippingOptions,
  } = useShippingOptions({ cart_id: cart.id })
  const setShippingMethodMutation = useSetCartShippingMethod()
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    cart.shipping_methods?.[0]?.shipping_option_id || ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [optionAvailability, setOptionAvailability] = useState<Record<string, ShippingOptionAvailability>>({})
  const hasAutoSelected = useRef(false)
  const handleAvailabilityChange = useCallback((optionId: string, state: ShippingOptionCalculationState, amount?: number) => {
    setOptionAvailability((current) => ({ ...current, [optionId]: { state, amount } }))
  }, [])

  useEffect(() => {
    if (selectedOptionId && !hasShippingOption(shippingOptions, selectedOptionId)) {
      setSelectedOptionId("")
      hasAutoSelected.current = false
      return
    }

    const firstSelectableOption = shippingOptions.find((option) =>
      isShippingOptionSelectable(
        option,
        optionAvailability[option.id]?.state ?? (option.price_type === "calculated" ? "pending" : "ready"),
        optionAvailability[option.id]?.amount,
      )
    )
    if (!hasAutoSelected.current && !selectedOptionId && firstSelectableOption) {
      hasAutoSelected.current = true
      setSelectedOptionId(firstSelectableOption.id)
    }
  }, [shippingOptions, selectedOptionId, optionAvailability])

  const [mutationError, setMutationError] = useState<string | null>(null)
  const selectedOption = shippingOptions.find((option) => option.id === selectedOptionId)
  const selectedAvailability = selectedOption ? optionAvailability[selectedOption.id] : undefined
  const selectedOptionReady = Boolean(
    selectedOption &&
    isShippingOptionSelectable(
      selectedOption,
      selectedAvailability?.state ?? (selectedOption.price_type === "calculated" ? "pending" : "ready"),
      selectedAvailability?.amount,
    )
  )

  const handleSubmit = async () => {
    const selectedState = selectedAvailability?.state ?? (selectedOption?.price_type === "calculated" ? "pending" : "ready")
    if (!selectedOptionId || !selectedOption || !isShippingOptionSelectable(selectedOption, selectedState, selectedAvailability?.amount) || isSubmitting) return

    setIsSubmitting(true)
    setMutationError(null)
    await setShippingMethodMutation.mutateAsync(
      {
        shipping_option_id: selectedOptionId,
      },
      {
        onSuccess: () => {
          onNext()
        },
        onSettled: () => {
          setIsSubmitting(false)
        },
        onError: (err: any) => {
          setMutationError(err.message || "Failed to select shipping method. Please try again.")
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3" role="radiogroup" aria-labelledby="shipping-options-title">
        <h3 id="shipping-options-title" className="sr-only">Opções de frete</h3>
        {getShippingOptionsViewState({ isLoading: shippingOptionsLoading, isError: shippingOptionsError, options: shippingOptions }) === "loading" && (
          <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600" role="status">Carregando opções de entrega...</p>
        )}
        {getShippingOptionsViewState({ isLoading: shippingOptionsLoading, isError: shippingOptionsError, options: shippingOptions }) === "error" && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900" role="alert">
            <p>Não foi possível carregar as opções de entrega.</p>
            <p className="mt-1 text-red-800">Verifique o endereço e tente novamente.</p>
            <Button type="button" variant="secondary" className="mt-3" onClick={() => refetchShippingOptions()}>Tentar novamente</Button>
            {shippingOptionsQueryError && <span className="sr-only">{shippingOptionsQueryError.message}</span>}
          </div>
        )}
        {getShippingOptionsViewState({ isLoading: shippingOptionsLoading, isError: shippingOptionsError, options: shippingOptions }) === "empty" && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="status">
            Não há opções de entrega disponíveis para este endereço e os itens do carrinho.
          </div>
        )}
        {shippingOptions.map((option) => (
          <ShippingItemSelector
            key={option.id}
            shippingOption={option}
            isSelected={selectedOptionId === option.id}
            handleSelect={(optionId) => {
              const candidate = shippingOptions.find((item) => item.id === optionId)
              const availability = candidate ? optionAvailability[candidate.id] : undefined
              const state = availability?.state ?? (candidate?.price_type === "calculated" ? "pending" : "ready")
              if (candidate && isShippingOptionSelectable(candidate, state, availability?.amount)) setSelectedOptionId(optionId)
            }}
            onAvailabilityChange={handleAvailabilityChange}
            cart={cart}
          />
        ))}
      </div>

      {mutationError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded-md" aria-live="assertive">
          {mutationError}
        </div>
      )}

      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onBack} disabled={isSubmitting} className="motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]">
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedOptionReady || isSubmitting}
          className="motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}

export default DeliveryStep
