import type { CheckoutCustomerInfo } from "@/lib/payments/contracts"

export const CHECKOUT_DRAFT_VERSION = 1
export const CHECKOUT_DRAFT_STORAGE_KEY = "frigga_checkout_draft"

export type CheckoutDraft = {
  version: number
  cartId: string
  customerInfo: CheckoutCustomerInfo
  addressConfirmed: boolean
  authState: "guest" | "authenticated"
  customerId: string | null
}

export type CheckoutDraftSession = {
  cartId?: string | null
  authState: "loading" | "authenticated" | "guest"
  customerId?: string | null
}

export const emptyCustomerInfo = (): CheckoutCustomerInfo => ({
  personType: "individual",
  document: "",
  legalName: "",
  tradeName: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
})

/** Rejects malformed/legacy drafts while stripping nullish personal fields. */
export const sanitizeCheckoutDraft = (value: unknown): CheckoutDraft | null => {
  if (!value || typeof value !== "object") return null
  const input = value as Partial<CheckoutDraft>
  if (input.version !== CHECKOUT_DRAFT_VERSION || typeof input.cartId !== "string" || !input.cartId || typeof input.addressConfirmed !== "boolean") return null
  if (!input.customerInfo || typeof input.customerInfo !== "object") return null
  const raw = input.customerInfo as Partial<CheckoutCustomerInfo>
  const authState = input.authState === "authenticated" ? "authenticated" : "guest"
  const customerId = typeof input.customerId === "string" && input.customerId.trim() ? input.customerId : null
  // An authenticated draft without a canonical customer id cannot be safely
  // associated with an account and must never be restored.
  if (authState === "authenticated" && !customerId) return null
  return {
    version: CHECKOUT_DRAFT_VERSION,
    cartId: input.cartId,
    addressConfirmed: input.addressConfirmed,
    authState,
    customerId,
    customerInfo: {
      personType: raw.personType === "business" ? "business" : "individual",
      document: typeof raw.document === "string" ? raw.document : "",
      legalName: typeof raw.legalName === "string" ? raw.legalName : "",
      tradeName: typeof raw.tradeName === "string" ? raw.tradeName : "",
      firstName: typeof raw.firstName === "string" ? raw.firstName : "",
      lastName: typeof raw.lastName === "string" ? raw.lastName : "",
      email: typeof raw.email === "string" ? raw.email : "",
      phone: typeof raw.phone === "string" ? raw.phone : "",
    },
  }
}

/**
 * Storage is only a draft cache. A draft is restorable only when it belongs to
 * the current cart and identity that the backend has already classified.
 */
export const isCheckoutDraftSafeForSession = (
  draft: CheckoutDraft | null,
  session: CheckoutDraftSession,
): boolean => {
  if (!draft || session.authState === "loading") return true
  if (session.cartId && draft.cartId !== session.cartId) return false
  if (session.authState === "guest") return draft.authState !== "authenticated"
  if (draft.authState !== "authenticated") return false
  return Boolean(session.customerId && draft.customerId === session.customerId)
}

export const readCheckoutDraftStorage = (): CheckoutDraft | null => {
  if (typeof window === "undefined") return null
  try {
    const raw = JSON.parse(window.sessionStorage.getItem(CHECKOUT_DRAFT_STORAGE_KEY) || "null") as unknown
    const draft = sanitizeCheckoutDraft(raw)
    if (!draft && raw !== null) window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
    return draft
  } catch {
    // Remove malformed data when possible; a disabled storage still must not
    // block checkout or become an authority for identity/payment state.
    try { window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY) } catch { /* noop */ }
    return null
  }
}

export const writeCheckoutDraftStorage = (draft: CheckoutDraft): void => {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(CHECKOUT_DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // Storage is an optimization only; checkout remains usable in memory.
  }
}

export const clearCheckoutDraftStorage = (): void => {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(CHECKOUT_DRAFT_STORAGE_KEY)
  } catch {
    // Ignore unavailable storage; no checkout authority depends on it.
  }
}
