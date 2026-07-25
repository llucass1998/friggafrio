import { Outlet } from "@tanstack/react-router"
import { PublicLayout } from "./public-layout"
import { useAuth } from "@/lib/hooks/use-auth"

export default function Layout() {
  const { isAuthenticated, isLoading } = useAuth()

  console.log("[Layout] render - isAuthenticated:", isAuthenticated, "isLoading:", isLoading)

  // Em todos os estados renderizamos o layout público B2C
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  )
}
