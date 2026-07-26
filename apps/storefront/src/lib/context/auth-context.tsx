import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { sdk } from "@/lib/medusa"
import { HttpTypes } from "@medusajs/types"
import { getMe, Employee, CustomerWithEmployee } from "@/lib/data/me"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  customer: HttpTypes.StoreCustomer | null
  employee: Employee | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Key to track auth state to avoid loading flash on navigation
const AUTH_STATE_KEY = "auth_state"

export function AuthProvider({ children }: { children: ReactNode }) {
  // SSR-safe state initialization without relying on window/sessionStorage during render
  // This ensures the server and initial client render always match
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)

  // Sync with sessionStorage only on the client side after hydration
  useEffect(() => {
    const cachedAuthState = sessionStorage.getItem(AUTH_STATE_KEY)
    if (cachedAuthState === "authenticated") {
      setIsAuthenticated(true)
    }
  }, [])

  const fetchCustomer = useCallback(async () => {
    console.log("[AuthContext] fetchCustomer called")
    try {
      // Fetch basic customer data
      const { customer } = await sdk.store.customer.retrieve({
        fields: "id,email,first_name,last_name,phone,has_account"
      })
      console.log("[AuthContext] customer retrieved:", customer?.email)

      // Fetch employee data before updating any state so the layout
      // never sees isAuthenticated=true with employee still null.
      // This prevents the dashboard from flashing before the pending
      // review screen when a company hasn't been activated yet.
      let employeeData: Employee | null = null
      try {
        const { customer: customerWithEmployee } = await getMe()
        if (customerWithEmployee.employee) {
          employeeData = customerWithEmployee.employee
          console.log("[AuthContext] employee data retrieved:", employeeData.is_admin ? "admin" : "buyer")
        }
      } catch {
        // Not a B2B customer or error fetching employee data
      }

      // Batch all state updates together so React renders once with
      // the complete picture (customer + employee + authenticated).
      setCustomer(customer)
      setEmployee(employeeData)
      setIsAuthenticated(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_STATE_KEY, "authenticated")
      }
    } catch (error) {
      console.log("[AuthContext] fetchCustomer error:", error)
      setCustomer(null)
      setEmployee(null)
      setIsAuthenticated(false)
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_STATE_KEY, "unauthenticated")
      }
    } finally {
      console.log("[AuthContext] fetchCustomer done, setting isLoading=false")
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  const login = async (email: string, password: string) => {
    console.log("[AuthContext] login called")
    const response = await sdk.auth.login("customer", "emailpass", { email, password })
    if (response.token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("medusa_auth_token", response.token)
      }
    }
    console.log("[AuthContext] sdk.auth.login successful, fetching customer. Cookies:", document.cookie)
    await fetchCustomer()
    console.log("[AuthContext] login complete, isAuthenticated:", isAuthenticated)
  }

  const loginWithGoogle = async (credential: string) => {
    console.log("[AuthContext] loginWithGoogle called")
    // Post token to Medusa backend for validation and session creation
    const response = await fetch(`${import.meta.env.VITE_MEDUSA_BACKEND_URL}/auth/customer/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Erro ao fazer login com Google")
    }

    console.log("[AuthContext] Google login successful in backend, fetching customer")
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
      if (typeof window !== "undefined") {
        sessionStorage.setItem(AUTH_STATE_KEY, "unauthenticated")
      }
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
