import {
  ADMIN_LANGUAGE_STORAGE_KEY,
  resolveAdminLanguagePreference,
} from "./admin-language-bootstrap"

const readCookie = (key: string): string | null => {
  try {
    const entry = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${key}=`))

    return entry ? decodeURIComponent(entry.slice(key.length + 1)) : null
  } catch {
    return null
  }
}

/** Seed the official detector caches before the Dashboard module initializes. */
export const initializeAdminLanguage = (): void => {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return
  }

  const cookieLanguage = readCookie(ADMIN_LANGUAGE_STORAGE_KEY)
  let localLanguage: string | null = null

  try {
    localLanguage = window.localStorage.getItem(ADMIN_LANGUAGE_STORAGE_KEY)
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }

  const preferredLanguage = resolveAdminLanguagePreference(
    cookieLanguage,
    localLanguage,
  )

  try {
    document.cookie = `${ADMIN_LANGUAGE_STORAGE_KEY}=${encodeURIComponent(preferredLanguage)}; Path=/; SameSite=Lax`
  } catch {
    // Cookie writes can be rejected by browser policy without blocking Admin.
  }

  try {
    window.localStorage.setItem(ADMIN_LANGUAGE_STORAGE_KEY, preferredLanguage)
  } catch {
    // Keep the cookie as the fallback detector source.
  }
}

initializeAdminLanguage()
