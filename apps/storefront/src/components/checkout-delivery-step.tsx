import ShippingItemSelector from "@/components/shipping-item-selector"
import { Button } from "@/components/ui/button"
import {
  useSetCartShippingMethod,
  useShippingOptions,
} from "@/lib/hooks/use-checkout"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState } from "react"

interface DeliveryStepProps {
  cart: HttpTypes.StoreCart;
  onNext: () => void;
  onBack: () => void;
}

import { Loader2 } from "lucide-react"

const DeliveryStep = ({ cart, onNext, onBack }: DeliveryStepProps) => {
  const { data: shippingOptions, isLoading: isOptionsLoading } = useShippingOptions({ cart_id: cart.id })
  const setShippingMethodMutation = useSetCartShippingMethod()
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    cart.shipping_methods?.[0]?.shipping_option_id || ""
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const hasAutoSelected = useRef(false)

  useEffect(() => {
    // Auto-select first option if none selected and options are available
    if (!hasAutoSelected.current && !selectedOptionId && shippingOptions && shippingOptions.length > 0) {
      hasAutoSelected.current = true
      setSelectedOptionId(shippingOptions[0].id)
    }
  }, [shippingOptions, selectedOptionId])

  const [mutationError, setMutationError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!selectedOptionId || isSubmitting) return

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
        onError: (err) => {
          setMutationError(err instanceof Error ? err.message : "Failed to select shipping method. Please try again.")
        },
      }
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3" role="radiogroup" aria-labelledby="shipping-options-title">
        <h3 id="shipping-options-title" className="sr-only">Opções de frete</h3>
        {isOptionsLoading ? (
           <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-3">
             <Loader2 className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
             <p className="text-sm">Buscando cotações de frete para o CEP {cart.shipping_address?.postal_code}...</p>
           </div>
        ) : (!shippingOptions || shippingOptions.length === 0) ? (
          <div className="text-sm text-text-secondary italic p-4 bg-zinc-50 border border-zinc-200 rounded-md">
            Nenhuma opção de entrega encontrada para este carrinho. Verifique se o CEP informado ({cart.shipping_address?.postal_code}) está correto ou entre em contato com o suporte.
          </div>
        ) : (
          shippingOptions.map((option) => (
            <ShippingItemSelector
              key={option.id}
              shippingOption={option}
              isSelected={selectedOptionId === option.id}
              handleSelect={setSelectedOptionId}
              cart={cart}
            />
          ))
        )}
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
          disabled={!selectedOptionId || isSubmitting}
          className="motion-interactive focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        >
          Próximo
        </Button>
      </div>
    </div>
  )
}

export default DeliveryStep
