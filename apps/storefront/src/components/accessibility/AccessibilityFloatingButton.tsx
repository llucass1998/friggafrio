import React from "react"
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider"
import { Accessibility } from "lucide-react"

export function AccessibilityFloatingButton() {
  const { preferences, togglePanel } = useAccessibility()

  return (
    <button
      id="a11y-floating-button"
      onClick={togglePanel}
      className={`fixed left-4 bottom-24 z-[9980] w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 focus:not-sr-only focus:outline-none focus:ring-4 focus:ring-[var(--color-accent)] focus:ring-offset-2 ${preferences.panelEnabled ? "bg-[var(--color-navy)] text-white" : "bg-[var(--color-primary)] text-white"}`}
      aria-label="Abrir recursos de acessibilidade"
      aria-expanded={preferences.panelEnabled}
      aria-controls="a11y-panel-drawer"
    >
      <Accessibility className="w-6 h-6" />
    </button>
  )
}
