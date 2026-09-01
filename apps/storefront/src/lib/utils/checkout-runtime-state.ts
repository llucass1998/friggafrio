import type { CheckoutPreparedSummary } from "@/lib/data/checkout/prepare"
import type { CheckoutPaymentSelection } from "@/lib/payments/contracts"

const preparedCache = new Map<string, CheckoutPreparedSummary>()
const selectionCache = new Map<string, CheckoutPaymentSelection>()

export const checkoutRuntimeKey = (
  cartId: string | null | undefined,
  authState: "loading" | "authenticated" | "guest",
  customerId?: string | null,
): string | null => cartId
  ? `${cartId}:${authState === "authenticated" ? customerId || "authenticated" : authState}`
  : null

export const readPreparedCheckoutState = (key: string | null): CheckoutPreparedSummary | null =>
  key ? preparedCache.get(key) || null : null

export const readCheckoutSelectionState = (key: string | null): CheckoutPaymentSelection | null =>
  key ? selectionCache.get(key) || null : null

export const writePreparedCheckoutState = (key: string | null, summary: CheckoutPreparedSummary): void => {
  if (key) preparedCache.set(key, summary)
}

export const writeCheckoutSelectionState = (key: string | null, selection: CheckoutPaymentSelection | null): void => {
  if (!key) return
  if (selection) selectionCache.set(key, selection)
  else selectionCache.delete(key)
}

export const clearCheckoutRuntimeState = (): void => {
  preparedCache.clear()
  selectionCache.clear()
}

export const clearCheckoutRuntimeStateKey = (key: string | null): void => {
  if (!key) return
  preparedCache.delete(key)
  selectionCache.delete(key)
}
