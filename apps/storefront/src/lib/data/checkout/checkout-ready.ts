export type CheckoutReadyResponse = {
  checkout_ready?: boolean
  code?: string
  message?: string
}

export type CheckoutReadyRequest = {
  method: "POST"
  body: Record<string, never>
}

export type CheckoutReadyFetcher = (
  input: string,
  init: CheckoutReadyRequest,
) => Promise<CheckoutReadyResponse>

export class CheckoutReadyError extends Error {
  readonly status?: number
  readonly code?: string

  constructor(message: string, options: { status?: number; code?: string } = {}) {
    super(message)
    this.name = "CheckoutReadyError"
    this.status = options.status
    this.code = options.code
  }
}

/**
 * The server owns checkout readiness; completion must not run until this
 * reservation boundary accepts the current cart.
 */
export const assertCheckoutReady = async (
  cartId: string,
  fetcher: CheckoutReadyFetcher,
): Promise<void> => {
  try {
    const result = await fetcher(
      `/store/carts/${encodeURIComponent(cartId)}/checkout-ready`,
      { method: "POST", body: {} },
    )

    if (!result.checkout_ready) {
      throw new CheckoutReadyError(
        result.message || "Cart is not checkout-ready",
        { code: result.code },
      )
    }
  } catch (error) {
    if (error instanceof CheckoutReadyError) {
      throw error
    }

    const details = error && typeof error === "object" ? error as {
      message?: unknown
      status?: unknown
      code?: unknown
    } : undefined
    const message = typeof details?.message === "string" ? details.message : "Request failed"
    const status = typeof details?.status === "number" ? details.status : undefined
    const code = typeof details?.code === "string" ? details.code : undefined
    throw new CheckoutReadyError(`Checkout readiness failed: ${message}`, { status, code })
  }
}
