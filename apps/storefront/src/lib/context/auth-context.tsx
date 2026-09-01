import { useState, useEffect, useCallback, ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useLocation } from "@tanstack/react-router"
import { sdk } from "@/lib/medusa"
import { HttpTypes } from "@medusajs/types"
import { getMe, Employee } from "@/lib/data/me"
import { AuthContext } from "@/lib/context/auth-context-value"
import { resetFavoritesForLogout } from "@/lib/hooks/use-favorites"
import { clearGuestCep } from "@/lib/cep"
import { clearCheckoutRuntimeState } from "@/lib/utils/checkout-runtime-state"
import { getStoredCart } from "@/lib/utils/cart"
import { transferGuestCartToCustomer } from "@/lib/auth/cart-session"

// This is only a local hint. The backend remains the authority for the session.
const AUTH_STATE_KEY = "auth_state"

const writeAuthHint = (authenticated: boolean): void => {
  if (typeof window === "undefined") {
    return
  }

  const value = authenticated ? "authenticated" : "unauthenticated"
  sessionStorage.setItem(AUTH_STATE_KEY, value)
  localStorage.setItem(AUTH_STATE_KEY, value)
}

/** A repeated logout may legitimately race with an already-cleared session. */
export const isAlreadyLoggedOutError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return false
  }

  const status = (error as { status?: unknown }).status
  return status === 401 || status === 404
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const location = useLocation()
  // SSR-safe state initialization without relying on window/sessionStorage during render
  // This ensures the server and initial client render always match
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isAdminSession, setIsAdminSession] = useState(false)
  const authState = isLoading
    ? "loading"
    : isAuthenticated
      ? "authenticated"
      : "guest"

  const fetchCustomer = useCallback(async (): Promise<boolean> => {
    try {
      // Fetch basic customer data
      const { customer } = await sdk.store.customer.retrieve({
        fields: "id,email,first_name,last_name,phone,has_account,default_shipping_address_id,addresses.*"
      })

      // Fetch employee data before updating any state so the layout
      // never sees isAuthenticated=true with employee still null.
      // This prevents the dashboard from flashing before the pending
      // review screen when a company hasn't been activated yet.
      let employeeData: Employee | null = null
      try {
        const { customer: customerWithEmployee } = await getMe()
        if (customerWithEmployee.employee) {
          employeeData = customerWithEmployee.employee
        }
      } catch {
        // Not a B2B customer or error fetching employee data
      }

      // OAuth callbacks establish the server session through a browser
      // redirect, so there is no login() call to perform cart handoff. The
      // same idempotent ownership check used by password login covers that
      // path without trusting local storage as an authority.
      try {
        await transferGuestCartToCustomer(getStoredCart(), customer.id, {
          retrieve: async (cartId) => {
            const { cart } = await sdk.store.cart.retrieve(cartId, { fields: "id,customer_id" })
            return { id: cart.id, customer_id: cart.customer_id ?? null }
          },
          transfer: async (cartId) => {
            const { cart } = await sdk.store.cart.transferCart(cartId, { fields: "id,customer_id" })
            return { id: cart.id, customer_id: cart.customer_id ?? null }
          },
        })
      } catch {
        // A cart owned by another account stays untouched and is revalidated
        // by the server on the next checkout request.
      }

      // Batch all state updates together so React renders once with
      // the complete picture (customer + employee + authenticated).
      setCustomer(customer)
      setEmployee(employeeData)
      setIsAdminSession(false)
      setIsAuthenticated(true)
      writeAuthHint(true)
      return true
    } catch {
      setCustomer(null)
      setEmployee(null)
      return false
    }
  }, [])

  const fetchAdminSession = useCallback(async (): Promise<boolean> => {
    try {
      const session = await sdk.client.fetch<{ redirect_to?: string | null }>(
        "/store/auth/session",
        { method: "GET" },
      )
      if (session.redirect_to !== "/app") {
        return false
      }
      setCustomer(null)
      setEmployee(null)
      setIsAdminSession(true)
      setIsAuthenticated(true)
      writeAuthHint(true)
      return true
    } catch {
      setIsAdminSession(false)
      setIsAuthenticated(false)
      writeAuthHint(false)
      return false
    }
  }, [])

  const probeSession = useCallback(async ({ includeAdmin = true }: { includeAdmin?: boolean } = {}): Promise<"customer" | "admin" | "guest"> => {
    setIsLoading(true)
    if (await fetchCustomer()) {
      setIsLoading(false)
      return "customer"
    }
    if (includeAdmin && await fetchAdminSession()) {
      setIsLoading(false)
      return "admin"
    }
    setCustomer(null)
    setEmployee(null)
    setIsAdminSession(false)
    setIsAuthenticated(false)
    writeAuthHint(false)
    setIsLoading(false)
    return "guest"
  }, [fetchAdminSession, fetchCustomer])

  const requiresImmediateSession = /\/(?:checkout|account(?:\/|$)|employees(?:\/|$)|quotes(?:\/|$)|order(?:\/|$))/.test(location.pathname)

  useEffect(() => {
    if (requiresImmediateSession) {
      void probeSession()
      return
    }

    // Public pages can paint their catalog before their optional session probe.
    // Checkout and account routes still verify the Medusa session immediately.
    const deferProbe = () => void probeSession({ includeAdmin: false })
    const idleCallback = window.requestIdleCallback?.(deferProbe, { timeout: 250 })
    const timeout = idleCallback === undefined ? window.setTimeout(deferProbe, 100) : undefined

    return () => {
      if (idleCallback !== undefined) window.cancelIdleCallback?.(idleCallback)
      if (timeout !== undefined) window.clearTimeout(timeout)
    }
  }, [probeSession, requiresImmediateSession])

  const login = async (email: string, password: string): Promise<"customer" | "admin"> => {
    await sdk.client.fetch("/auth/unified/emailpass", {
      method: "POST",
      body: { email, password },
    })

    const actor = await probeSession()
    if (actor === "guest") throw new Error("Não foi possível validar a sessão de cliente.")
    if (actor === "customer") {
      const authenticatedCustomer = await sdk.store.customer.retrieve({ fields: "id" })
      await transferGuestCartToCustomer(getStoredCart(), authenticatedCustomer.customer.id, {
        retrieve: async (cartId) => {
          const { cart } = await sdk.store.cart.retrieve(cartId, { fields: "id,customer_id" })
          return { id: cart.id, customer_id: cart.customer_id ?? null }
        },
        transfer: async (cartId) => {
          const { cart } = await sdk.store.cart.transferCart(cartId, { fields: "id,customer_id" })
          return { id: cart.id, customer_id: cart.customer_id ?? null }
        },
      })
    }
    return actor
  }

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("medusa_auth_token")
      }
      await sdk.auth.logout()
    } catch (error) {
      // Keep logout idempotent when the server has already invalidated the
      // session, while still surfacing transport/server failures.
      if (!isAlreadyLoggedOutError(error)) {
        throw error
      }
    } finally {
      resetFavoritesForLogout()
      clearGuestCep()
      // Private account responses must never be reused by the next session.
      queryClient.clear()
      // Checkout preparation and method selections are identity-scoped and
      // must not survive a logout or account switch.
      clearCheckoutRuntimeState()
      // Update cached state so navigation doesn't show loading
      writeAuthHint(false)
      setCustomer(null)
      setEmployee(null)
      setIsAdminSession(false)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    // Don't set isLoading to true on refetch - it causes full-page spinner
    // Components should handle their own loading states for refetch scenarios
    if (!(await fetchCustomer())) {
      await fetchAdminSession()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        authState,
        isAuthenticated,
        isLoading,
        customer,
        employee,
        isAdmin: isAdminSession || (employee?.is_admin ?? false),
        login,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
