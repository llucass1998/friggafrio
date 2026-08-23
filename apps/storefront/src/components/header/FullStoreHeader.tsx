import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderActions } from "@/components/header/HeaderActions"
import { HeaderDesktopNav } from "@/components/header/HeaderDesktopNav"
import { HeaderMobileDrawer } from "@/components/header/HeaderMobileDrawer"
import { HeaderLogo } from "@/components/header/HeaderLogo"
import { HeaderPostalCode } from "@/components/header/HeaderPostalCode"

export function FullStoreHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-border)] bg-[var(--color-background)] lg:relative">
      {/* O Top bar com telefone e infos extras foi migrado para o AccessibilityTopBar para unificar a acessibilidade e layout
          conforme as instruções da Fase 2 */}

      {/* Main Header Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between gap-3 lg:h-24 lg:gap-8">

          {/* Mobile Menu & Logo */}
          <div className="min-w-0 shrink">
            <div className="lg:hidden"><HeaderLogo /></div>
            <div className="hidden lg:block"><HeaderLogo /></div>
          </div>

          {/* Search (Desktop) */}
          <div className="hidden lg:flex flex-1 justify-center max-w-2xl">
            <HeaderSearch />
          </div>

          <HeaderPostalCode />

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-1">
            <HeaderActions />
            <HeaderMobileDrawer />
          </div>
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
