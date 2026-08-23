import { PublicHeader } from "@/components/public-header"
import { PublicFooter } from "@/components/public-footer"
import { FloatingActions } from "@/components/FloatingActions"
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button"
import { CartDropdown } from "@/components/cart"
import { useLocation } from "@tanstack/react-router"
import {
  AccessibilityProvider,
  AccessibilityPanel,
  AccessibilityFloatingButton,
  SkipLinks,
  ReadingGuide,
  VLibrasWidget,
  LiveRegion
} from "@/components/accessibility"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const location = useLocation()
  const pageKey = location.href

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans text-[var(--color-text)]">
        <SkipLinks />
        <LiveRegion />

        <PublicHeader />

        {/* Ajuste de espaçamento pro header: h-16 (mobile) + top bar h-8 (desktop) + header md h-20 */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 flex flex-col focus:outline-none"
        >
          <div key={pageKey} className="flex flex-1 flex-col motion-page-enter">
            {children}
          </div>
        </main>

        <PublicFooter />

        {/* Botões fixos globais */}
        <FloatingWhatsAppButton />
        <FloatingActions />
        <AccessibilityFloatingButton />

        {/* Dropdown/Drawer Global do Carrinho */}
        <CartDropdown />

        {/* Painel e Recursos Visuais de Acessibilidade */}
        <AccessibilityPanel />
        <ReadingGuide />
        <VLibrasWidget />
      </div>
    </AccessibilityProvider>
  )
}
