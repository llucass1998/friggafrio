import { PublicHeader } from "./public-header"
import { PublicFooter } from "./public-footer"
import { PreviewBanner } from "./preview-banner"
import { FloatingActions } from "./FloatingActions"
import { FloatingWhatsAppButton } from "./floating-whatsapp-button"

interface PublicLayoutProps {
  children: React.ReactNode
}

export function PublicLayout({ children }: PublicLayoutProps) {
  const bannerFlag = import.meta.env.VITE_SHOW_BANNER_FOR_PREVIEW
  // Show banner whenever the env var is defined (set in dev/preview, absent in production).
  // Treat "false" and "0" as opt-out values.
  const showBanner =
    bannerFlag !== undefined &&
    bannerFlag !== "false" &&
    bannerFlag !== "0" &&
    bannerFlag !== false

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col font-sans text-[var(--color-text)]">
      <PreviewBanner forceShow={showBanner} />
      <PublicHeader bannerVisible={showBanner} />

      {/* Ajuste de espaçamento pro header: h-16 (mobile) + top bar h-8 (desktop) + header md h-20 */}
      <main className={`flex-1 flex flex-col ${showBanner ? "pt-[140px] md:pt-[156px]" : "pt-16 md:pt-28"}`}>
        {children}
      </main>

      <PublicFooter />

      {/* Botões fixos globais */}
      <FloatingWhatsAppButton />
      <FloatingActions />
    </div>
  )
}
