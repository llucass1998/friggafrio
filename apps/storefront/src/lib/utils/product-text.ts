const PRODUCT_ENTITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/&quot;|&#34;|&#x22;/gi, '"'],
  [/&apos;|&#39;|&#x27;/gi, "'"],
  [/&amp;/gi, "&"],
  [/&lt;/gi, "<"],
  [/&gt;/gi, ">"],
]

const DISPLAY_TERMS: Record<string, string> = {
  btus: "BTUs",
  btu: "BTU",
  cfm: "CFM",
  hp: "HP",
  led: "LED",
  pvc: "PVC",
  wifi: "Wi-Fi",
  plus: "Plus",
  vacuo: "vácuo",
  valvula: "válvula",
  estagio: "estágio",
  liquido: "líquido",
}

const PROTECTED_TOKEN = /^(?=.*\d)[A-Z0-9./-]+$/i

/** Presentation-only normalization for legacy all-caps catalog titles. */
export function normalizeProductDisplayName(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1")
  if (!cleaned || cleaned !== cleaned.toLocaleUpperCase("pt-BR")) return cleaned
  let firstWord = true
  return cleaned.replace(/[A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9./-]*/g, (token) => {
    if (PROTECTED_TOKEN.test(token)) {
      firstWord = false
      return token.toLocaleUpperCase("pt-BR")
    }
    const lower = token.toLocaleLowerCase("pt-BR")
    const normalized = DISPLAY_TERMS[lower] ?? lower
    if (!firstWord) return normalized
    firstWord = false
    return `${normalized.slice(0, 1).toLocaleUpperCase("pt-BR")}${normalized.slice(1)}`
  })
}

export function decodeProductText(value: string): string {
  let decoded = value
  for (let pass = 0; pass < 3; pass += 1) {
    const next = PRODUCT_ENTITY_REPLACEMENTS.reduce(
      (text, [pattern, replacement]) => text.replace(pattern, replacement),
      decoded,
    )
    if (next === decoded) break
    decoded = next
  }
  const decodeCodePoint = (value: string, radix: number) => {
    const codePoint = Number.parseInt(value, radix)
    return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : ""
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(code, 10))
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(code, 16))
  return normalizeProductDisplayName(decoded.replace(/<[^>]*>/g, ""))
}
