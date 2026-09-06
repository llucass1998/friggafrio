import * as Sentry from "@sentry/react"

let initialized = false
const scrubUrl = (value: string): string => {
  try {
    const url = new URL(value, window.location.origin)
    url.search = ""
    url.hash = ""
    return url.toString()
  } catch {
    return "[invalid-url]"
  }
}
const scrubText = (value: string): string => value
  .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
  .replace(/([?&](?:token|authorization|password|email|cpf)=)[^&\s]+/gi, "$1[redacted]")

export const initSentry = (): void => {
  if (initialized || typeof window === "undefined") return
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn || !/^https:\/\/[^/]+\/.+/.test(dsn)) return
  initialized = true
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0,
    integrations: [],
    beforeSend(event) {
      if (event.request?.url) event.request.url = scrubUrl(event.request.url)
      delete event.user
      delete event.server_name
      event.contexts = {}
      for (const exception of event.exception?.values || []) {
        if (exception.value) exception.value = scrubText(exception.value)
      }
      return event
    },
    beforeBreadcrumb(breadcrumb) {
      if (breadcrumb.category === "navigation" && typeof breadcrumb.data?.to === "string") {
        breadcrumb.data = { to: scrubUrl(breadcrumb.data.to) }
      } else {
        delete breadcrumb.data
      }
      return breadcrumb
    },
  })
}

export const reportClientError = (error: Error): void => {
  initSentry()
  if (initialized) Sentry.captureException(error)
}
