export const ADMIN_LANGUAGE_STORAGE_KEY = "lng" as const
export const ADMIN_DEFAULT_LANGUAGE = "ptBR" as const

// Keep this allowlist aligned with the language registry shipped by Medusa 2.18.
export const ADMIN_SUPPORTED_LANGUAGES = [
  "bs",
  "bg",
  "en",
  "enGB",
  "es",
  "el",
  "de",
  "fr",
  "he",
  "hr",
  "hu",
  "it",
  "ja",
  "pl",
  "ptBR",
  "ptPT",
  "tr",
  "th",
  "uk",
  "ro",
  "mk",
  "mn",
  "ar",
  "zhCN",
  "fa",
  "cs",
  "ru",
  "lt",
  "vi",
  "id",
  "ko",
  "nl",
  "zhTW",
] as const

export type AdminLanguage = (typeof ADMIN_SUPPORTED_LANGUAGES)[number]

export function resolveAdminLanguage(value: unknown): AdminLanguage {
  return typeof value === "string" &&
    (ADMIN_SUPPORTED_LANGUAGES as readonly string[]).includes(value)
    ? (value as AdminLanguage)
    : ADMIN_DEFAULT_LANGUAGE
}

/**
 * Match Medusa's detector precedence: a cookie is an explicit preference;
 * local storage is used only when the cookie is absent.
 */
export function resolveAdminLanguagePreference(
  cookieValue: string | null,
  localStorageValue: string | null,
): AdminLanguage {
  return cookieValue === null
    ? resolveAdminLanguage(localStorageValue)
    : resolveAdminLanguage(cookieValue)
}
