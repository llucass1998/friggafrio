import type { HttpTypes } from "@medusajs/types"

export type ShippingOptionCalculationState = "pending" | "ready" | "error"
export type ShippingOptionsViewState = "loading" | "error" | "empty" | "ready"

export type ShippingOptionAvailability = {
  state: ShippingOptionCalculationState
  amount?: number | null
}

type ShippingOptionDeliveryCopySource = {
  data?: Record<string, unknown> | null
  type?: {
    description?: unknown
  } | null
}

/** Return only delivery copy supplied by the shipping provider/server. */
export function getShippingOptionDeliveryCopy(
  option: ShippingOptionDeliveryCopySource,
): string | undefined {
  const candidates = [
    option.data?.description,
    option.data?.estimated_delivery,
    option.type?.description,
  ]

  return candidates.find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate.trim().length > 0,
  )
}

export function getShippingOptionsViewState({
  isLoading,
  isError,
  options,
}: {
  isLoading: boolean
  isError: boolean
  options?: HttpTypes.StoreCartShippingOption[]
}): ShippingOptionsViewState {
  if (isLoading) return "loading"
  if (isError) return "error"
  if (!options?.length) return "empty"
  return "ready"
}

export function isShippingOptionSelectable(
  option: Pick<HttpTypes.StoreCartShippingOption, "price_type" | "amount">,
  calculationState: ShippingOptionCalculationState = "ready",
  resolvedAmount?: number | null,
): boolean {
  if (option.price_type === "calculated" && calculationState !== "ready") return false

  const amount = resolvedAmount ?? option.amount
  return typeof amount === "number" && Number.isFinite(amount) && amount >= 0
}

export function hasShippingOption(
  options: HttpTypes.StoreCartShippingOption[] | undefined,
  optionId: string | undefined
): boolean {
  return Boolean(optionId && options?.some((option) => option.id === optionId))
}
