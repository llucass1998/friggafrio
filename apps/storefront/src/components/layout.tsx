import { Outlet } from "@tanstack/react-router"
import { PublicLayout } from "@/components/public-layout"


export default function Layout() {
  

  // Logging removido para produção

  // Em todos os estados renderizamos o layout público B2C
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  )
}
