import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { sdk } from "../medusa"

interface Customer {
  id: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  has_account: boolean
}

interface AuthContextType {
  customer: Customer | null
  isLoading: boolean
  isAuthenticated: boolean
  refetch: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchCustomer = async () => {
    try {
      setIsLoading(true)
      const { customer } = await sdk.store.customer.retrieve({
        fields: "id,email,first_name,last_name,phone,has_account"
      })
      
      if (customer && customer.has_account) {
        setCustomer(customer as Customer)
      } else {
        setCustomer(null)
      }
    } catch (error) {
      // 401 ou erro significa não autenticado, apenas setamos null.
      setCustomer(null)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      setIsLoading(true)
      await sdk.auth.logout({
        // Auth Actor é "customer" na Store API
      })
    } catch (err) {
      console.error("Erro ao fazer logout:", err)
    } finally {
      setCustomer(null)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCustomer()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        customer,
        isLoading,
        isAuthenticated: !!customer,
        refetch: fetchCustomer,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider")
  }
  return context
}
