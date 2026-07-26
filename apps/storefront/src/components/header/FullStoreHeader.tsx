
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderActions } from "@/components/header/HeaderActions"
import { HeaderDesktopNav } from "@/components/header/HeaderDesktopNav"
import { HeaderMobileDrawer } from "@/components/header/HeaderMobileDrawer"
import { HeaderLogo } from "@/components/header/HeaderLogo"

import { useState, useEffect } from "react"

export function FullStoreHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  

  return (
    <header className="w-full bg-[var(--color-background)] border-b border-[var(--color-border)] relative z-40 transition-all duration-300">
      {/* O Top bar com telefone e infos extras foi migrado para o AccessibilityTopBar para unificar a acessibilidade e layout
          conforme as instruções da Fase 2 */}

      {/* Main Header Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between transition-all duration-300 gap-4 lg:gap-8 ${isScrolled ? "h-16" : "h-24"}`}>

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-2 lg:gap-0">
            <HeaderMobileDrawer />
            <div className="hidden sm:block lg:block">
              <HeaderLogo compact={isScrolled} />
            </div>
            <div className="block sm:hidden">
              <HeaderLogo compact />
            </div>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center max-w-2xl">
            <HeaderSearch compact={isScrolled} />
          </div>

          {/* Actions */}
          <HeaderActions compact={isScrolled} />
        </div>
      </div>

      {/* Bottom Navigation (Desktop) */}
      <div className={`container mx-auto px-4 sm:px-6 lg:px-8 border-t border-[var(--color-border)] hidden lg:block transition-all duration-300 overflow-visible ${isScrolled ? "h-10" : "h-12"}`}>
        <div className={`transition-all duration-300 ${isScrolled ? "h-10" : "h-12"}`}>
          <HeaderDesktopNav />
        </div>
      </div>
    </header>
  )
}
