import { Link, useParams } from "@tanstack/react-router"
import { HeaderSearch } from "./HeaderSearch"
import { HeaderActions } from "./HeaderActions"
import { HeaderDesktopNav } from "./HeaderDesktopNav"
import { HeaderMobileDrawer } from "./HeaderMobileDrawer"

export function FullStoreHeader() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  return (
    <header className="w-full bg-[var(--color-background)] border-b border-[var(--color-border)] relative z-40">
      {/* Top bar (Telefone, Infos extras) */}
      <div className="bg-[var(--color-surface-soft)] border-b border-[var(--color-border)] hidden md:block">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div>Atendimento: Segunda a Sexta das 08h às 18h</div>
          <div className="flex gap-4">
            <a href="tel:+5511948777156" className="hover:text-[var(--color-primary)] transition-colors">
              (11) 94877-7156
            </a>
            <Link to={`/${countryCode}/central-de-ajuda`} className="hover:text-[var(--color-primary)] transition-colors">
              Central de Ajuda
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Area */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 lg:gap-8">

          {/* Mobile Menu & Logo */}
          <div className="flex items-center gap-2 lg:gap-0">
            <HeaderMobileDrawer />
            <Link
              to={`/${countryCode}`}
              className="flex items-center gap-2 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md"
            >
              <span className="font-heading font-black text-2xl tracking-tighter text-[var(--color-navy)] uppercase hidden sm:block">
                Friggafrio
              </span>
              <span className="font-heading font-black text-2xl tracking-tighter text-[var(--color-navy)] uppercase sm:hidden">
                Frigga
              </span>
            </Link>
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
