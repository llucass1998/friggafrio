export const ANALYTICS_CONSENT_KEY = "friggafrio:analytics-consent"
export const ANALYTICS_CONSENT_DECISION_KEY = "friggafrio:analytics-consent-recorded"
export type AnalyticsConsent = "granted" | "denied"

export type AnalyticsEventName = "page_view" | "view_item_list" | "select_item" | "view_item" | "search" | "add_to_cart" | "remove_from_cart" | "view_cart" | "begin_checkout" | "add_shipping_info" | "add_payment_info" | "purchase"
type AnalyticsEvent = Record<string, string | number | boolean | undefined>

const hasWindow = (): boolean => typeof window !== "undefined"
const dataLayer = (): unknown[] => {
  if (!hasWindow()) return []
  const current = (window as Window & { dataLayer?: unknown[] }).dataLayer
  if (current) return current
  const created: unknown[] = []
  ;(window as Window & { dataLayer?: unknown[] }).dataLayer = created
  return created
}

const pushAnalyticsCommand = (...command: unknown[]): void => {
  dataLayer().push(command)
}

export const readAnalyticsConsent = (): AnalyticsConsent => {
  if (!hasWindow()) return "denied"
  return window.localStorage.getItem(ANALYTICS_CONSENT_KEY) === "granted" ? "granted" : "denied"
}

export const writeAnalyticsConsent = (consent: AnalyticsConsent): void => {
  if (!hasWindow()) return
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, consent)
  window.localStorage.setItem(ANALYTICS_CONSENT_DECISION_KEY, "true")
  pushAnalyticsCommand("consent", "update", {
    analytics_storage: consent,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })
}

export const hasAnalyticsConsentDecision = (): boolean => hasWindow() && window.localStorage.getItem(ANALYTICS_CONSENT_DECISION_KEY) === "true"

export const initializeAnalyticsConsent = (): void => {
  if (!hasWindow()) return
  pushAnalyticsCommand("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  })
}

let scriptPromise: Promise<void> | null = null
let configuredMeasurementId: string | null = null
let lastPageView: string | null = null

export const loadAnalytics = (measurementId: string): Promise<void> => {
  if (!hasWindow() || !/^G-[A-Z0-9]+$/i.test(measurementId)) return Promise.resolve()
  if (configuredMeasurementId === measurementId) return scriptPromise || Promise.resolve()
  configuredMeasurementId = measurementId
  const existing = document.querySelector<HTMLScriptElement>(`script[data-friggafrio-ga="${measurementId}"]`)
  if (existing) return Promise.resolve()
  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script")
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
    script.dataset.friggafrioGa = measurementId
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Analytics script failed to load"))
    document.head.appendChild(script)
  })
  pushAnalyticsCommand("js", new Date())
  pushAnalyticsCommand("config", measurementId, { send_page_view: false })
  return scriptPromise
}

export const trackAnalyticsEvent = (name: AnalyticsEventName, params: AnalyticsEvent = {}): void => {
  if (!hasWindow() || readAnalyticsConsent() !== "granted") return
  if (name === "page_view") {
    const page = String(params.page_location || "")
    if (page && page === lastPageView) return
    lastPageView = page
  }
  pushAnalyticsCommand("event", name, params)
}
