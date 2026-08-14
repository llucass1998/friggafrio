import {
  listShippingOptionsForCartWithPricingWorkflow,
  listShippingOptionsForCartWorkflow,
} from "@medusajs/medusa/core-flows"
import { StepResponse } from "@medusajs/framework/workflows-sdk"
import { createCommercialShippingContext } from "../../utils/commercial-shipping-policy"

type CartAddressContext = {
  shipping_address?: {
    country_code?: string | null
    province?: string | null
    city?: string | null
    postal_code?: string | null
    address_1?: string | null
  } | null
  items?: Array<{
    quantity?: number | null
    unit_price?: number | null
    metadata?: Record<string, unknown> | null
    variant?: { metadata?: Record<string, unknown> | null; product?: { metadata?: Record<string, unknown> | null } | null } | null
  }>
}

const shippingOptionsContext = async ({ cart }: { cart: CartAddressContext }) =>
  new StepResponse(await createCommercialShippingContext({
    address: cart.shipping_address ?? {},
    lines: cart.items ?? [],
  }))

// Native Store APIs use these workflows for both listing and selection. The
// browser provides an address, never an authority on zone, distance, or price.
listShippingOptionsForCartWorkflow.hooks.setShippingOptionsContext(shippingOptionsContext)
listShippingOptionsForCartWithPricingWorkflow.hooks.setShippingOptionsContext(shippingOptionsContext)
