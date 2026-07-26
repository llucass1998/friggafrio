import React, { useEffect, useState } from "react"
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider"

export function ReadingGuide() {
  const { preferences } = useAccessibility()
  const [mouseY, setMouseY] = useState(-100)

  useEffect(() => {
    if (!preferences.readingGuide) return

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [preferences.readingGuide])

  if (!preferences.readingGuide) return null

  return (
    <div 
      id="a11y-reading-guide"
      style={{ top: `${mouseY}px` }}
      aria-hidden="true"
    />
  )
}
