import { useParams } from "@tanstack/react-router"
import { useState, useEffect } from "react"
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderActions } from "@/components/header/HeaderActions"
import { HeaderDesktopNav } from "@/components/header/HeaderDesktopNav"
import { HeaderMobileDrawer } from "@/components/header/HeaderMobileDrawer"
import { HeaderLogo } from "@/components/header/HeaderLogo"

export function StickyCommerceHeader() {
  const [isVisible, setIsVisible] = useState(false)
  const params = useParams({ strict: false }) as Record<string, string>
  const _countryCode = params.countryCode || "br"

  useEffect(() => {
    const handleScroll = () => {
      // User requested activation between 120px and 160px.
      if (window.scrollY > 140) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-[var(--color-background)] shadow-md border-b border-[var(--color-border)] transform transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Mobile Menu */}
          <div className="flex items-center gap-2">
            <HeaderMobileDrawer />
            <HeaderLogo compact />
          </div>

          {/* Navigation (Desktop) */}
          <div className="hidden lg:block flex-shrink-0 mr-auto ml-4">
            <HeaderDesktopNav />
          </div>

          {/* Search (Tablet/Desktop) */}
          <div className="hidden md:flex flex-1 justify-end max-w-md mr-2">
            <HeaderSearch compact />
          </div>

          {/* Actions */}
          <HeaderActions compact />
        </div>
      </div>
    </div>
  )
}
