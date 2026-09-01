import { MEDUSA_BACKEND_URL, MEDUSA_PUBLISHABLE_KEY } from "@/config/env"

export type ShippingEstimateInput = {
  cart_id?: string
  postal_code?: string
  address_1?: string
  city?: string
  province?: string
  country_code?: string
}

export type ShippingEstimateOption = {
  id: string
  shipping_option_id?: string | null
  name: string
  amount: number
  currency_code: string
  delivery_estimate: string
  estimated_date?: string
  modality?: "pickup" | "motoboy" | "car"
  vehicle?: string
  distance_km?: number
  region?: string
  policy_version?: string
  amount_cents?: number
  available: boolean
  reason?: string
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
  region?: string
  subtotal_centavos?: number
  policy_version?: string
}

export const visibleShippingPlaceholders = (
  reason = "Calculando disponibilidade...",
  pickupShippingOptionId?: string,
): ShippingEstimateOption[] => [
  {
    id: "FRIGGAFRIO_PICKUP_STORE_1",
    shipping_option_id: pickupShippingOptionId,
    name: "Retirada na Loja 1",
    amount: 0,
    currency_code: "brl",
    delivery_estimate: "Aguardando preparacao",
    modality: "pickup",
    vehicle: "Retirada na Loja 1",
    available: true,
  },
  {
    id: "FRIGGAFRIO_CAR_CENTRAL",
    name: "Entrega normal - Carro FriggaFrio",
    amount: 0,
    currency_code: "brl",
    delivery_estimate: "Ate 3 dias uteis",
    modality: "car",
    vehicle: "Carro da empresa",
    available: false,
    reason,
  },
  {
    id: "FRIGGAFRIO_EXPRESS_0_10",
    name: "Entrega expressa - Motoboy",
    amount: 0,
    currency_code: "brl",
    delivery_estimate: "Ate 6 horas quando elegivel",
    modality: "motoboy",
    vehicle: "Motoboy",
    available: false,
    reason,
  },
]

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
