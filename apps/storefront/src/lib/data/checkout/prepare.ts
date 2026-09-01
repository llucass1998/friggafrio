import { sdk } from "@/lib/medusa"
import { getStoredCart } from "@/lib/utils/cart"

export type CheckoutValidationError = {
  code?: string
  message?: string
  field?: string
}

export type CheckoutPrepareResponse = {
  cart_id?: unknown
  checkout_state?: unknown
  customer?: { customer_id?: unknown; email?: unknown }
  address?: {
    first_name?: unknown
    last_name?: unknown
    city?: unknown
    province?: unknown
    postal_code?: unknown
    country_code?: unknown
  } | null
  billing_address?: {
    first_name?: unknown
    last_name?: unknown
    city?: unknown
    province?: unknown
    postal_code?: unknown
    country_code?: unknown
  } | null
  selected_shipping?: {
    id?: unknown
    name?: unknown
    amount?: unknown
    currency_code?: unknown
    delivery_estimate?: unknown
    delivery_copy?: unknown
  } | null
  items?: Array<{
    id?: unknown
    title?: unknown
    variant_id?: unknown
    quantity?: unknown
    unit_price?: unknown
    line_total?: unknown
  }>
  subtotal?: unknown
  shipping?: unknown
  total?: unknown
  currency?: unknown
  validation?: { valid?: unknown; errors?: CheckoutValidationError[] }
  readiness?: { token?: unknown; expires_at?: unknown; idempotent?: unknown }
}

export type CheckoutCustomerPayload = {
  person_type: "individual" | "business"
  document: string
  legal_name?: string
}

export type CheckoutPreparedItem = {
  id: string
  title: string
  variantId: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
}

export type CheckoutPreparedSummary = {
  cartId: string
  state: "READY_FOR_PAYMENT"
  email: string
  address: {
    firstName: string
    lastName: string
    city: string
    province: string
    postalCode: string
    countryCode: "br"
  } | null
  billingAddress: {
    firstName: string
    lastName: string
    city: string
    province: string
    postalCode: string
    countryCode: "br"
  } | null
  shipping: {
    id: string
    name: string
    amount: number
    currencyCode: "brl"
    deliveryEstimate?: string
    deliveryCopy?: string
  }
  items: CheckoutPreparedItem[]
  subtotal: number
  shippingTotal: number
  total: number
  currencyCode: "brl"
  readinessToken?: string
  expiresAt?: string
}

export class CheckoutPrepareError extends Error {
  readonly code?: string
  readonly status?: number
  readonly validationErrors: CheckoutValidationError[]

  constructor(
    message: string,
    options: { code?: string; status?: number; validationErrors?: CheckoutValidationError[] } = {},
  ) {
    super(message)
    this.name = "CheckoutPrepareError"
    this.code = options.code
    this.status = options.status
    this.validationErrors = options.validationErrors || []
  }
}

const numberOrNull = (value: unknown): number | null => {
  const number = typeof value === "number" ? value : Number(value)
  return Number.isFinite(number) ? number : null
}

const textOrEmpty = (value: unknown): string => typeof value === "string" ? value.trim() : ""

const responsePayload = (error: unknown): Partial<CheckoutPrepareResponse> => {
  if (!error || typeof error !== "object") return {}
  const candidate = error as { body?: unknown; response?: { data?: unknown }; data?: unknown }
  for (const value of [candidate.body, candidate.response?.data, candidate.data]) {
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value) as unknown
        if (parsed && typeof parsed === "object") return parsed as Partial<CheckoutPrepareResponse>
      } catch {
        // Preserve the generic controlled error when the SDK body is not JSON.
      }
    }
    if (value && typeof value === "object") return value as Partial<CheckoutPrepareResponse>
  }
  return {}
}

const controlledMessage = (errors: CheckoutValidationError[], fallback: string): string => {
  const code = errors[0]?.code
  switch (code) {
    case "INVALID_EMAIL":
      return "Confira o email informado."
    case "INVALID_NAME":
    case "INVALID_ADDRESS":
    case "INVALID_COUNTRY":
    case "INVALID_POSTAL_CODE":
      return "Confira os dados do endereço de entrega."
    case "SHIPPING_METHOD_REQUIRED":
    case "STALE_SHIPPING_OPTION":
    case "STALE_SHIPPING_AMOUNT":
    case "SHIPPING_UNAVAILABLE":
      return "A opção de entrega mudou ou não está disponível. Selecione outra opção."
    case "STALE_SUBTOTAL":
    case "STALE_SHIPPING_TOTAL":
    case "STALE_CART_TOTAL":
    case "PRICE_PENDING":
      return "Os valores do carrinho mudaram. Revise o carrinho e tente novamente."
    case "INSUFFICIENT_INVENTORY":
    case "INVENTORY_UNAVAILABLE":
      return "A disponibilidade dos itens mudou. Revise o carrinho e tente novamente."
    default:
      return fallback
  }
}

/** Keep only server-owned values that are safe for the checkout summary. */
export const sanitizeCheckoutPrepareResponse = (
  raw: CheckoutPrepareResponse,
): CheckoutPreparedSummary => {
  const validationErrors = raw.validation?.errors || []
  if (raw.checkout_state !== "READY_FOR_PAYMENT" || raw.validation?.valid === false) {
    throw new CheckoutPrepareError(
      controlledMessage(validationErrors, "Não foi possível preparar o checkout."),
      { code: validationErrors[0]?.code, validationErrors },
    )
  }

  const cartId = textOrEmpty(raw.cart_id)
  const email = textOrEmpty(raw.customer?.email).toLowerCase()
  const currencyCode = textOrEmpty(raw.currency).toLowerCase()
  const shipping = raw.selected_shipping
  const shippingId = textOrEmpty(shipping?.id)
  const shippingName = textOrEmpty(shipping?.name)
  const shippingAmount = numberOrNull(shipping?.amount)
  const subtotal = numberOrNull(raw.subtotal)
  const shippingTotal = numberOrNull(raw.shipping)
  const total = numberOrNull(raw.total)

  if (!cartId || !email || currencyCode !== "brl" || !shippingId || !shippingName ||
      shippingAmount === null || shippingAmount < 0 || subtotal === null || subtotal < 0 ||
      shippingTotal === null || shippingTotal < 0 || total === null || total < 0 ||
      shipping?.currency_code?.toString().toLowerCase() !== "brl") {
    throw new CheckoutPrepareError("A resposta de preparação do checkout é inválida.", {
      code: "INVALID_PREPARE_RESPONSE",
    })
  }

  const items = (raw.items || []).map((item, index) => {
    const quantity = numberOrNull(item.quantity)
    const unitPrice = numberOrNull(item.unit_price)
    const lineTotal = numberOrNull(item.line_total)
    if (!textOrEmpty(item.id) || quantity === null || !Number.isSafeInteger(quantity) || quantity < 1 ||
        unitPrice === null || unitPrice < 0 || lineTotal === null || lineTotal < 0) {
      throw new CheckoutPrepareError("A resposta de preparação contém um item inválido.", {
        code: `INVALID_PREPARE_ITEM_${index}`,
      })
    }
    return {
      id: textOrEmpty(item.id),
      title: textOrEmpty(item.title) || "Item do carrinho",
      variantId: textOrEmpty(item.variant_id) || null,
      quantity,
      unitPrice,
      lineTotal,
    }
  })

  const address = raw.address ? {
    firstName: textOrEmpty(raw.address.first_name),
    lastName: textOrEmpty(raw.address.last_name),
    city: textOrEmpty(raw.address.city),
    province: textOrEmpty(raw.address.province),
    postalCode: textOrEmpty(raw.address.postal_code),
    countryCode: "br" as const,
  } : null
  const billingAddress = raw.billing_address ? {
    firstName: textOrEmpty(raw.billing_address.first_name),
    lastName: textOrEmpty(raw.billing_address.last_name),
    city: textOrEmpty(raw.billing_address.city),
    province: textOrEmpty(raw.billing_address.province),
    postalCode: textOrEmpty(raw.billing_address.postal_code),
    countryCode: "br" as const,
  } : null

  return {
    cartId,
    state: "READY_FOR_PAYMENT",
    email,
    address,
    billingAddress,
    shipping: {
      id: shippingId,
      name: shippingName,
      amount: shippingAmount,
      currencyCode: "brl",
      ...(textOrEmpty(shipping.delivery_estimate) ? { deliveryEstimate: textOrEmpty(shipping.delivery_estimate) } : {}),
      ...(textOrEmpty(shipping.delivery_copy) ? { deliveryCopy: textOrEmpty(shipping.delivery_copy) } : {}),
    },
    items,
    subtotal,
    shippingTotal,
    total,
    currencyCode: "brl",
    ...(textOrEmpty(raw.readiness?.token) ? { readinessToken: textOrEmpty(raw.readiness?.token) } : {}),
    ...(textOrEmpty(raw.readiness?.expires_at) ? { expiresAt: textOrEmpty(raw.readiness?.expires_at) } : {}),
  }
}

export const prepareCartForPayment = async (
  shippingOptionId?: string,
  customer?: CheckoutCustomerPayload,
): Promise<CheckoutPreparedSummary> => {
  const cartId = getStoredCart()
  if (!cartId) throw new CheckoutPrepareError("Não foi possível encontrar o carrinho.", { code: "CART_NOT_FOUND" })

  try {
    const response = await sdk.client.fetch<CheckoutPrepareResponse>(
      `/store/carts/${encodeURIComponent(cartId)}/prepare`,
      {
        method: "POST",
        // The server owns all prices, totals, shipping amounts, and inventory decisions.
        body: {
          ...(shippingOptionId ? { shipping_option_id: shippingOptionId } : {}),
          ...(customer ? { customer } : {}),
        },
      },
    )
    return sanitizeCheckoutPrepareResponse(response)
  } catch (error) {
    if (error instanceof CheckoutPrepareError) throw error
    const payload = responsePayload(error)
    const validationErrors = payload.validation?.errors || []
    const status = typeof (error as { status?: unknown })?.status === "number"
      ? (error as { status: number }).status
      : undefined
    const fallback = error instanceof Error ? error.message : "Não foi possível preparar o checkout."
    throw new CheckoutPrepareError(controlledMessage(validationErrors, fallback), {
      code: validationErrors[0]?.code,
      status,
      validationErrors,
    })
  }
}
