import { useEffect, useRef } from "react"
import { useAccessibility } from "@/components/accessibility/AccessibilityProvider"

export function ReadingGuide() {
  const { preferences } = useAccessibility()
  const guideRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!preferences.readingGuide) return

    let rafId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        if (guideRef.current) {
          guideRef.current.style.top = `${e.clientY}px`
        }
        rafId = null
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [preferences.readingGuide])

  if (!preferences.readingGuide) return null

  return (
    <div 
      ref={guideRef}
      id="a11y-reading-guide"
      style={{ top: "-100px" }}
      aria-hidden="true"
    />
  )
}
