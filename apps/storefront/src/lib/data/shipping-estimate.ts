import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/config/env"

export type ShippingEstimateInput = {
  cart_id?: string
  postal_code: string
  address_1: string
  city: string
  province?: string
  country_code?: string
}

export type ShippingEstimateOption = {
  id: string
  name: string
  amount: number
  currency_code: string
  delivery_estimate: string
}

export type ShippingEstimateResponse = {
  status: "ready" | "unavailable"
  reason?: string
  options: ShippingEstimateOption[]
  currency_code: string
  address?: {
    city: string
    province: string | null
    postal_code: string
    country_code: string
  }
}

export async function estimateShipping(input: ShippingEstimateInput): Promise<ShippingEstimateResponse> {
  const response = await fetch(`${MEDUSA_BACKEND_URL}/store/shipping/estimate`, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      ...(MEDUSA_PUBLISHABLE_KEY ? { "x-publishable-api-key": MEDUSA_PUBLISHABLE_KEY } : {}),
    },
    body: JSON.stringify(input),
  })

  const payload = await response.json().catch(() => null) as ShippingEstimateResponse | null
  if (!response.ok && response.status !== 422) {
    throw new Error("Nao foi possivel calcular a entrega")
  }

  return payload ?? {
    status: "unavailable",
    reason: "INVALID_RESPONSE",
    options: [],
    currency_code: "brl",
  }
}
