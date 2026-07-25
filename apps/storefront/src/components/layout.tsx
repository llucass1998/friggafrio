import { useState, useEffect } from "react"
import { Outlet } from "@tanstack/react-router"
import { Sidebar } from "./sidebar"
import { PublicLayout } from "./public-layout"
import { useAuth } from "@/lib/hooks/use-auth"
import { CompanyPendingScreen } from "./company-pending-screen"
import { OnboardingTour } from "./onboarding-tour"

export default function Layout() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isAuthenticated, isLoading, employee } = useAuth()

  console.log("[Layout] render - isAuthenticated:", isAuthenticated, "isLoading:", isLoading)

  useEffect(() => {
    const savedState = localStorage.getItem("sidebar_collapsed")
    if (savedState !== null) {
      setIsCollapsed(savedState === "true")
    }
  }, [])

  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem("sidebar_collapsed", String(newState))
  }

  // Always use PublicLayout as the shell for unauthenticated or unknown states.
  // This matches the SSR render exactly, avoiding hydration mismatch.
  // We only show the dashboard if explicitly authenticated and loaded.

  // For unauthenticated users (or while we are figuring it out), render public layout
  if (!isAuthenticated) {
    return (
      <PublicLayout>
        <Outlet />
      </PublicLayout>
    )
  }

  // If we are authenticated but still loading employee data, we show a localized spinner inside the dashboard shell
  // But we avoid returning a full screen spinner that replaces the layout.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[var(--color-primary)] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Company not yet activated -- show pending review screen
  const companyStatus = employee?.company?.status
  if (companyStatus && companyStatus !== "active") {
    return <CompanyPendingScreen companyName={employee?.company?.name} status={companyStatus} />
  }

  // Show authenticated dashboard layout
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar countryCode="us" collapsed={isCollapsed} onToggle={toggleCollapsed} />
      <main
        className={`flex-1 transition-all duration-300 ${
          isCollapsed ? "ml-[72px]" : "ml-[280px]"
        }`}
      >
        <Outlet />
      </main>
      <OnboardingTour />
    </div>
  )
}
