import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { AccessibilityPreferences, DEFAULT_PREFERENCES } from "@/components/accessibility/accessibility.types"

interface AccessibilityContextData {
  preferences: AccessibilityPreferences;
  updatePreference: <K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => void;
  resetPreferences: () => void;
  togglePanel: () => void;
  speak: (text: string) => void;
  pauseSpeech: () => void;
  resumeSpeech: () => void;
  cancelSpeech: () => void;
  isSpeaking: boolean;
}

const STORAGE_KEY = "friggafrio:a11y:v1"

const AccessibilityContext = createContext<AccessibilityContextData | undefined>(undefined)

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES)
  const [mounted, setMounted] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Load preferences safely on client side only (avoid hydration mismatch)
  useEffect(() => {
    setMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only merge valid keys to prevent prototype pollution or invalid state
        const merged = { ...DEFAULT_PREFERENCES }
        Object.keys(DEFAULT_PREFERENCES).forEach((key) => {
          const k = key as keyof AccessibilityPreferences
          if (parsed[k] !== undefined) {
            // Type assertions needed for dynamic assignment
            (merged as Record<string, unknown>)[k] = parsed[k]
          }
        })
        setPreferences(merged)
      }
    } catch (e) {
      console.warn("Failed to load accessibility preferences", e)
    }
  }, [])

  // Save to local storage and apply to document.documentElement
  useEffect(() => {
    if (!mounted) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))

    const root = document.documentElement
    root.setAttribute("data-a11y-font-scale", preferences.fontScale.toString())
    root.setAttribute("data-a11y-contrast", preferences.contrast)
    root.setAttribute("data-a11y-grayscale", preferences.grayscale.toString())
    root.setAttribute("data-a11y-links", preferences.underlineLinks.toString())
    root.setAttribute("data-a11y-line-spacing", preferences.lineSpacing)
    root.setAttribute("data-a11y-letter-spacing", preferences.letterSpacing)
    root.setAttribute("data-a11y-focus", preferences.enhancedFocus.toString())
    root.setAttribute("data-a11y-motion", preferences.reducedMotion.toString())
    root.setAttribute("data-a11y-reading-guide", preferences.readingGuide.toString())
  }, [preferences, mounted])

  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(key: K, value: AccessibilityPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }, [])

  const cancelSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const resetPreferences = useCallback(() => {
    // Preserve the panel open state
    setPreferences({ ...DEFAULT_PREFERENCES, panelEnabled: preferences.panelEnabled })
    
  }, [preferences.panelEnabled])

  const togglePanel = useCallback(() => {
    setPreferences((prev) => ({ ...prev, panelEnabled: !prev.panelEnabled }))
  }, [])

  // Web Speech API
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = "pt-BR"

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const pauseSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause()
      setIsSpeaking(false)
    }
  }, [])

  const resumeSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume()
      setIsSpeaking(true)
    }
  }, [])

  

  return (
    <AccessibilityContext.Provider
      value={{
        preferences,
        updatePreference,
        resetPreferences,
        togglePanel,
        speak,
        pauseSpeech,
        resumeSpeech,
        cancelSpeech,
        isSpeaking,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  )
}

function useAccessibilityContext() {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error("useAccessibility must be used within an AccessibilityProvider")
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { useAccessibilityContext as useAccessibility }
