import React from "react"
import { useAccessibility } from "@/components/accessibility/accessibility-context"
import { Accessibility } from "lucide-react"

export function AccessibilityFloatingButton() {
  const { preferences, togglePanel } = useAccessibility()

  return (
    <button
      id="a11y-floating-button"
      onClick={togglePanel}
      className={`fixed bottom-24 left-4 z-[9980] hidden h-12 w-12 items-center justify-center rounded-full shadow-lg transition-[background-color,box-shadow,transform] duration-[var(--motion-duration-interaction)] hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 md:flex md:left-6 ${preferences.panelEnabled ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-primary)] text-white"}`}
      aria-label="Abrir opções de acessibilidade"
      aria-expanded={preferences.panelEnabled}
      aria-controls="a11y-panel-drawer"
    >
      <Accessibility className="pointer-events-none w-6 h-6" aria-hidden="true" />
    </button>
  )
}
