import { subscribeToScreenReaderAnnouncements } from "@/components/accessibility/live-region-announcer"
import { useEffect, useState } from "react"

export function LiveRegion() {
  const [message, setMessage] = useState("")

  useEffect(() => {
    let clearTimer: ReturnType<typeof setTimeout> | undefined
    const unsubscribe = subscribeToScreenReaderAnnouncements((nextMessage) => {
      setMessage(nextMessage)
      clearTimeout(clearTimer)
      clearTimer = setTimeout(() => setMessage(""), 3000)
    })

    return () => {
      unsubscribe()
      clearTimeout(clearTimer)
    }
  }, [])

  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true" 
      className="sr-only"
    >
      {message}
    </div>
  )
}
