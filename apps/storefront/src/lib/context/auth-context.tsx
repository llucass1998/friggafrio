import { useState, useEffect, useCallback, ReactNode } from "react"
import { sdk } from "@/lib/medusa"
import { HttpTypes } from "@medusajs/types"
import { getMe, Employee } from "@/lib/data/me"
import { AuthContext } from "@/lib/context/auth-context-value"

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

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR-safe state initialization without relying on window/sessionStorage during render
  // This ensures the server and initial client render always match
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)

  const fetchCustomer = useCallback(async () => {
    try {
      // Fetch basic customer data
      const { customer } = await sdk.store.customer.retrieve({
        fields: "id,email,first_name,last_name,phone,has_account"
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
      setIsAuthenticated(true)
      writeAuthHint(true)
    } catch {
      setCustomer(null)
      setEmployee(null)
      setIsAuthenticated(false)
      // A stale/expired marker must not cause a 401 loop on every navigation.
      writeAuthHint(false)
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

    void fetchCustomer()
  }, [fetchCustomer])

  const login = async (email: string, password: string) => {
    const response = await sdk.auth.login("customer", "emailpass", { email, password })
    if (typeof response !== "string") {
      throw new Error("O login requer uma etapa adicional de autenticação.")
    }
    await fetchCustomer()
  }

  const loginWithGoogle = async (credential: string) => {
    // Post token to Medusa backend for validation and session creation
    const response = await fetch(`${import.meta.env.VITE_MEDUSA_BACKEND_URL}/auth/customer/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ credential }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erro ao fazer login com Google")
    }

    await fetchCustomer()
  }

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("medusa_auth_token")
      }
      await sdk.auth.logout()
    } finally {
      // Update cached state so navigation doesn't show loading
      writeAuthHint(false)
      setCustomer(null)
      setEmployee(null)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    // Don't set isLoading to true on refetch - it causes full-page spinner
    // Components should handle their own loading states for refetch scenarios
    await fetchCustomer()
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        customer,
        employee,
        isAdmin: employee?.is_admin ?? false,
        login,
        loginWithGoogle,
        logout,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
