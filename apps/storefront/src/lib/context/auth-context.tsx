import { useState, useEffect, useCallback, ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa"
import { HttpTypes } from "@medusajs/types"
import { getMe, Employee } from "@/lib/data/me"
import { AuthContext } from "@/lib/context/auth-context-value"
import { resetFavoritesForLogout } from "@/lib/hooks/use-favorites"
import { clearGuestCep } from "@/lib/cep"

// This is only a local hint. The backend remains the authority for the session.
const AUTH_STATE_KEY = "auth_state"

const readAuthHint = (): boolean => {
  if (typeof window === "undefined") {
    return false
  }

  return (
    sessionStorage.getItem(AUTH_STATE_KEY) === "authenticated" ||
    localStorage.getItem(AUTH_STATE_KEY) === "authenticated"
  )
}

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
  // SSR-safe state initialization without relying on window/sessionStorage during render
  // This ensures the server and initial client render always match
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isAdminSession, setIsAdminSession] = useState(false)

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
    } finally {
      setIsLoading(false)
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
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Guest pages do not need an authenticated customer request. Only probe
    // the protected endpoint when a prior successful login left a local hint.
    if (!readAuthHint()) {
      setIsLoading(false)
      return
    }

    void (async () => {
      if (!(await fetchCustomer())) {
        await fetchAdminSession()
      }
    })()
  }, [fetchAdminSession, fetchCustomer])

  const login = async (email: string, password: string): Promise<"customer" | "admin"> => {
    await sdk.client.fetch("/auth/unified/emailpass", {
      method: "POST",
      body: { email, password },
    })

    if (await fetchAdminSession()) {
      return "admin"
    }

    if (!(await fetchCustomer())) {
      throw new Error("Não foi possível validar a sessão de cliente.")
    }
    return "customer"
  }

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("medusa_auth_token")
      }
      await sdk.auth.logout()
    } catch (error) {
      if (!isAlreadyLoggedOutError(error)) {
        throw error
      }
    } finally {
      resetFavoritesForLogout()
      clearGuestCep()
      // Private account responses must never be reused by the next session.
      queryClient.clear()
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
