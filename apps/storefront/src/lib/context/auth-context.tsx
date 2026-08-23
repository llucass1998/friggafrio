import { useState, useEffect, useCallback, type ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { sdk } from "@/lib/medusa"
import type { HttpTypes } from "@medusajs/types"
import { getMe, type Employee } from "@/lib/data/me"
import { AuthContext } from "@/lib/context/auth-context-value"
import { resetFavoritesForLogout } from "@/lib/hooks/use-favorites"
import { clearGuestCep } from "@/lib/cep"

// This remains only a UX hint; the server is always the session authority.
const AUTH_STATE_KEY = "auth_state"

const writeAuthHint = (authenticated: boolean): void => {
  if (typeof window === "undefined") return
  const value = authenticated ? "authenticated" : "unauthenticated"
  sessionStorage.setItem(AUTH_STATE_KEY, value)
  localStorage.setItem(AUTH_STATE_KEY, value)
}

type AuthStatus =
  | { authenticated: false; actor: null }
  | { authenticated: true; actor: "customer" }
  | { authenticated: true; actor: "user"; redirect_to: "/app" }

let authStatusInFlight: Promise<AuthStatus> | null = null

const getSafeAuthStatus = (): Promise<AuthStatus> => {
  if (!authStatusInFlight) {
    authStatusInFlight = sdk.client.fetch<AuthStatus>("/store/auth/status", { method: "GET" })
      .finally(() => { authStatusInFlight = null })
  }
  return authStatusInFlight
}

/** A repeated logout may legitimately race with an already-cleared session. */
export const isAlreadyLoggedOutError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null || !("status" in error)) return false
  return (error as { status?: unknown }).status === 401 || (error as { status?: unknown }).status === 404
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [customer, setCustomer] = useState<HttpTypes.StoreCustomer | null>(null)
  const [employee, setEmployee] = useState<Employee | null>(null)
  const [isAdminSession, setIsAdminSession] = useState(false)

  const fetchCustomer = useCallback(async (): Promise<boolean> => {
    try {
      const { customer: currentCustomer } = await sdk.store.customer.retrieve({
        fields: "id,email,first_name,last_name,phone,has_account,default_shipping_address_id,addresses.*",
      })
      let employeeData: Employee | null = null
      try {
        const { customer: customerWithEmployee } = await getMe()
        employeeData = customerWithEmployee.employee || null
      } catch {
        // An absent B2B profile is valid for a standard Customer session.
      }
      setCustomer(currentCustomer)
      setEmployee(employeeData)
      setIsAdminSession(false)
      setIsAuthenticated(true)
      writeAuthHint(true)
      return true
    } catch {
      setCustomer(null)
      setEmployee(null)
      setIsAdminSession(false)
      setIsAuthenticated(false)
      writeAuthHint(false)
      return false
    }
  }, [])

  const bootstrapSession = useCallback(async (): Promise<"customer" | "admin" | null> => {
    try {
      const status = await getSafeAuthStatus()
      if (!status.authenticated) {
        setCustomer(null)
        setEmployee(null)
        setIsAdminSession(false)
        setIsAuthenticated(false)
        writeAuthHint(false)
        return null
      }
      if (status.actor === "user") {
        setCustomer(null)
        setEmployee(null)
        setIsAdminSession(true)
        setIsAuthenticated(true)
        writeAuthHint(true)
        return "admin"
      }
      return (await fetchCustomer()) ? "customer" : null
    } catch {
      setCustomer(null)
      setEmployee(null)
      setIsAdminSession(false)
      setIsAuthenticated(false)
      writeAuthHint(false)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [fetchCustomer])

  useEffect(() => {
    // Public boot makes exactly one optional-auth request. Customer Me remains
    // protected and is reached only after the server identifies a customer.
    void bootstrapSession()
  }, [bootstrapSession])

  const login = async (email: string, password: string): Promise<"customer" | "admin"> => {
    await sdk.client.fetch("/auth/unified/emailpass", {
      method: "POST",
      body: { email, password },
    })
    const actor = await bootstrapSession()
    if (!actor) throw new Error("Não foi possível validar a sessão.")
    return actor
  }

  const logout = async () => {
    try {
      if (typeof window !== "undefined") localStorage.removeItem("medusa_auth_token")
      await sdk.auth.logout()
    } catch (error) {
      if (!isAlreadyLoggedOutError(error)) throw error
    } finally {
      resetFavoritesForLogout()
      clearGuestCep()
      queryClient.clear()
      writeAuthHint(false)
      setCustomer(null)
      setEmployee(null)
      setIsAdminSession(false)
      setIsAuthenticated(false)
      setIsLoading(false)
    }
  }

  const refetch = async () => {
    await bootstrapSession()
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
