import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

type Address = Record<string, unknown> & { country_code?: unknown }
type CheckoutAddressBody = {
  shipping_address?: Address
  billing_address?: Address
}

const toBrazil = (address: Address | undefined): void => {
  if (address) {
    address.country_code = "br"
  }
}

/** Keeps checkout address payloads aligned with the Brazil-only storefront. */
export const forceBrazilCheckoutCountry = (
  req: MedusaRequest<CheckoutAddressBody>,
  _res: MedusaResponse,
  next: MedusaNextFunction,
): void => {
  const body = req.body
  if (body && typeof body === "object") {
    toBrazil(body.shipping_address)
    toBrazil(body.billing_address)
  }

  next()
}
