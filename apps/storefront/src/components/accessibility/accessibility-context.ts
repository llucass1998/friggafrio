import type { AccessibilityPreferences } from "@/components/accessibility/accessibility.types"
import { createContext, useContext } from "react"

export interface AccessibilityContextData {
  preferences: AccessibilityPreferences
  updatePreference: <K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => void
  resetPreferences: () => void
  togglePanel: () => void
  speak: (text: string) => void
  pauseSpeech: () => void
  resumeSpeech: () => void
  cancelSpeech: () => void
  isSpeaking: boolean
}

export const AccessibilityContext = createContext<
  AccessibilityContextData | undefined
>(undefined)

export function useAccessibility() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    )
  }
  return context
}
