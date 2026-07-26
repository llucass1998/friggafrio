import { Link, useParams } from "@tanstack/react-router"
import { HeaderSearch } from "./HeaderSearch"
import { HeaderActions } from "./HeaderActions"
import { HeaderDesktopNav } from "./HeaderDesktopNav"
import { HeaderMobileDrawer } from "./HeaderMobileDrawer"
import { HeaderLogo } from "./HeaderLogo"

export function FullStoreHeader() {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  return (
    <header className="w-full bg-[var(--color-background)] border-b border-[var(--color-border)] relative z-40">
      {/* O Top bar com telefone e infos extras foi migrado para o AccessibilityTopBar para unificar a acessibilidade e layout
          conforme as instruções da Fase 2 */}

      {/* Main Header Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-24 gap-4 lg:gap-8">

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-2 lg:gap-0">
            <HeaderMobileDrawer />
            <div className="hidden sm:block lg:block">
              <HeaderLogo />
            </div>
            <div className="block sm:hidden">
              <HeaderLogo compact />
            </div>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center max-w-2xl">
            <HeaderSearch />
          </div>

          {/* Actions */}
          <HeaderActions />
        </div>
      </div>

      {/* Bottom Navigation (Desktop) */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 border-t border-[var(--color-border)] hidden lg:block">
        <div className="h-12">
          <HeaderDesktopNav />
        </div>
      </div>
    </header>
  )
}
