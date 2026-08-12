import { useState, useEffect } from "react"
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderActions } from "@/components/header/HeaderActions"
import { HeaderDesktopNav } from "@/components/header/HeaderDesktopNav"
import { HeaderLogo } from "@/components/header/HeaderLogo"

export function StickyCommerceHeader() {
  const [isVisible, setIsVisible] = useState(false)
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
      className={`fixed left-0 right-0 top-0 z-50 hidden transform border-b border-[var(--color-border)] bg-[var(--color-background)] shadow-md transition-transform duration-[var(--motion-duration-medium)] ease-[var(--motion-ease-move)] lg:block ${
        isVisible ? "translate-y-0" : "pointer-events-none invisible -translate-y-full"
      }`}
      aria-hidden={!isVisible}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
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
