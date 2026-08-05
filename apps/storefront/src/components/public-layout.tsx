import { PublicHeader } from "./public-header"
import { PublicFooter } from "./public-footer"
import { FloatingActions } from "./FloatingActions"
import { FloatingWhatsAppButton } from "./floating-whatsapp-button"
import { CartDropdown } from "./cart"
import {
  AccessibilityProvider,
  AccessibilityTopBar,
  AccessibilityPanel,
  AccessibilityFloatingButton,
  SkipLinks,
  ReadingGuide,
  VLibrasWidget,
  LiveRegion
} from "./accessibility"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans text-[var(--color-text)]">
        <SkipLinks />
        <LiveRegion />

        <AccessibilityTopBar />
        <PublicHeader />

        {/* Ajuste de espaçamento pro header: h-16 (mobile) + top bar h-8 (desktop) + header md h-20 */}
        {/* Adicionado padding para compensar a AccessibilityTopBar */}
        <main
          id="main-content"
          tabIndex={-1}
          className={`flex-1 flex flex-col focus:outline-none pt-16 md:pt-[148px]`}
        >
          {children}
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

