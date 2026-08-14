import { Loading } from "@/components/ui/loading"
import { Price } from "@/components/ui/price"
import Radio from "@/components/ui/radio"
import { calculatePriceForShippingOption } from "@/lib/utils/checkout"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef, useState } from "react"
import {
  getShippingOptionDeliveryCopy,
  isShippingOptionSelectable,
  type ShippingOptionCalculationState,
} from "@/lib/utils/shipping-state"

type ShippingItemSelectorProps = {
  shippingOption: HttpTypes.StoreCartShippingOption;
  cart: HttpTypes.StoreCart;
  isSelected: boolean;
  handleSelect: (optionId: string) => void;
  onAvailabilityChange?: (optionId: string, state: ShippingOptionCalculationState, amount?: number) => void;
};

const ShippingItemSelector = ({
  shippingOption,
  cart,
  isSelected,
  handleSelect,
  onAvailabilityChange,
}: ShippingItemSelectorProps) => {
  const [calculatedPrice, setCalculatedPrice] = useState<number | undefined>(undefined)
  const isMounted = useRef(true)
  const [calculationError, setCalculationError] = useState(false)
  const price =
    shippingOption.price_type === "calculated"
      ? calculatedPrice
      : shippingOption.amount
  const hasValidAmount = typeof price === "number" && Number.isFinite(price) && price >= 0
  const amountUnavailable = !hasValidAmount && shippingOption.price_type !== "calculated"
  const deliveryCopy = getShippingOptionDeliveryCopy(shippingOption)
  const isDisabled =
    !hasValidAmount ||
    !isShippingOptionSelectable(shippingOption, calculationError ? "error" : "ready", price)

  useEffect(() => {
    isMounted.current = true

    if (shippingOption.price_type !== "calculated") {
      const flatAmount = shippingOption.amount
      const flatAmountIsValid = typeof flatAmount === "number" && Number.isFinite(flatAmount) && flatAmount >= 0
      onAvailabilityChange?.(
        shippingOption.id,
        flatAmountIsValid ? "ready" : "error",
        flatAmountIsValid ? flatAmount : undefined,
      )
      return
    }

    setCalculationError(false)
    onAvailabilityChange?.(shippingOption.id, "pending")

    calculatePriceForShippingOption({
      option_id: shippingOption.id,
    })
      .then((option) => {
        if (isMounted.current) {
          setCalculatedPrice(option.amount)
          const amount = option.amount
          if (typeof amount === "number" && Number.isFinite(amount) && amount >= 0) {
            onAvailabilityChange?.(shippingOption.id, "ready", amount)
          } else {
            setCalculationError(true)
            onAvailabilityChange?.(shippingOption.id, "error")
          }
        }
      })
      .catch(() => {
        if (isMounted.current) {
          setCalculationError(true)
          onAvailabilityChange?.(shippingOption.id, "error")
        }
      })

    return () => {
      isMounted.current = false
    }
  }, [onAvailabilityChange, shippingOption.amount, shippingOption.id, shippingOption.price_type])

  return (
    <label
      className={`block transition-all duration-200 ${
        isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <div
        className={`flex items-center justify-between p-5 border transition-colors ${
          isSelected
            ? "border-zinc-900 bg-zinc-50"
            : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <div className="flex items-center gap-4">
          <Radio
            checked={isSelected}
            onChange={() => handleSelect(shippingOption.id)}
            disabled={isDisabled}
          />

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-semibold text-zinc-900">
                {shippingOption.name}
              </p>
            </div>
            {deliveryCopy && (
              <p className="text-xs text-zinc-600 mt-1">
                {deliveryCopy}
              </p>
            )}
          </div>
        </div>

        <div className="text-right">
          {calculationError || amountUnavailable ? (
            <span className="text-xs font-medium text-red-700">Frete indisponível</span>
          ) : typeof price === "number" ? (
            <Price
              price={price}
              currencyCode={cart.currency_code}
              textWeight="plus"
            />
          ) : (
            <Loading className="w-4 h-4" rows={1} />
          )}
        </div>
      </div>
    </label>
  )
}

export default ShippingItemSelector
