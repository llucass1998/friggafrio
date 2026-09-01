import { createContext } from "react"
import type { HttpTypes } from "@medusajs/types"
import type { Employee } from "@/lib/data/me"

export interface AuthContextValue {
  authState: "loading" | "authenticated" | "guest"
  isAuthenticated: boolean
  isLoading: boolean
  customer: HttpTypes.StoreCustomer | null
  employee: Employee | null
  isAdmin: boolean
  login: (email: string, password: string) => Promise<"customer" | "admin">
  logout: () => Promise<void>
  refetch: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
