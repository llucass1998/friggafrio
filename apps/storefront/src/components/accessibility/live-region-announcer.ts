type AnnouncementListener = (message: string) => void

const listeners = new Set<AnnouncementListener>()

export function announceToScreenReader(message: string) {
  listeners.forEach((listener) => listener(message))
}

export function subscribeToScreenReaderAnnouncements(
  listener: AnnouncementListener
) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
