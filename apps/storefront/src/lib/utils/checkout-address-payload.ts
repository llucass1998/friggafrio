export type CheckoutAddressPayload = Record<string, string>

const requiredAddressFields = ["first_name", "last_name", "address_1", "city", "postal_code", "country_code"] as const

const cleanAddress = (value: Record<string, unknown>): CheckoutAddressPayload =>
  Object.fromEntries(
    Object.entries(value)
      .filter(([, fieldValue]) => fieldValue !== null && fieldValue !== undefined)
      .map(([key, fieldValue]) => [key, String(fieldValue)])
      .filter(([, fieldValue]) => fieldValue.trim().length > 0),
  )

export const hasCompleteCheckoutAddress = (value: Record<string, unknown>): boolean => {
  const clean = cleanAddress(value)
  return requiredAddressFields.every((field) => Boolean(clean[field]))
}

export const buildCheckoutAddressPayload = ({
  email,
  pickupOnly,
  shippingAddress,
  billingAddress,
}: {
  email: string
  pickupOnly: boolean
  shippingAddress?: Record<string, unknown>
  billingAddress?: Record<string, unknown>
}): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    email,
    metadata: {
      frigga_fulfillment_mode: pickupOnly ? "pickup" : "delivery",
      ...(pickupOnly ? { pickup_location: "FRIGGAFRIO_STORE_1" } : {}),
    },
  }

  // Pickup is a fulfillment choice and must not send null or synthetic addresses.
  if (pickupOnly) return payload

  if (shippingAddress && hasCompleteCheckoutAddress(shippingAddress)) {
    payload.shipping_address = cleanAddress(shippingAddress)
  }
  if (billingAddress && hasCompleteCheckoutAddress(billingAddress)) {
    payload.billing_address = cleanAddress(billingAddress)
  }
  return payload
}
