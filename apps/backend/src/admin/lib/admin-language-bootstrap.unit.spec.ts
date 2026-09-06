import {
  ADMIN_DEFAULT_LANGUAGE,
  ADMIN_LANGUAGE_STORAGE_KEY,
  resolveAdminLanguagePreference,
  resolveAdminLanguage,
} from "./admin-language-bootstrap"

describe("Medusa Admin language bootstrap", () => {
  it("uses ptBR when storage is absent or invalid", () => {
    expect(resolveAdminLanguage(undefined)).toBe(ADMIN_DEFAULT_LANGUAGE)
    expect(resolveAdminLanguage("invalid")).toBe(ADMIN_DEFAULT_LANGUAGE)
  })

  it("preserves every supported explicit language", () => {
    expect(resolveAdminLanguage("en")).toBe("en")
    expect(resolveAdminLanguage("ptBR")).toBe("ptBR")
  })

  it("uses ptBR on a first visit and when a saved value is invalid", () => {
    expect(resolveAdminLanguagePreference(null, null)).toBe("ptBR")
    expect(resolveAdminLanguagePreference(null, "unknown")).toBe("ptBR")
    expect(resolveAdminLanguagePreference("unknown", "en")).toBe("ptBR")
  })

  it("preserves a valid user preference across detector storage", () => {
    expect(resolveAdminLanguagePreference("en", "ptBR")).toBe("en")
    expect(resolveAdminLanguagePreference(null, "en")).toBe("en")
    expect(resolveAdminLanguagePreference("ptBR", "en")).toBe("ptBR")
  })

  it("uses the official detector storage key", () => {
    expect(ADMIN_LANGUAGE_STORAGE_KEY).toBe("lng")
  })
})
