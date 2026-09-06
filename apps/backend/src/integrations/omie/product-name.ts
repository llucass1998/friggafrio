const ACCENTED_TERMS: Record<string, string> = {
  vacuo: "vácuo",
  valvula: "válvula",
  estagio: "estágio",
  liquido: "líquido",
  conexao: "conexão",
  conexoes: "conexões",
  refrigeracao: "refrigeração",
  climatizacao: "climatização",
}

const PROPER_TERMS: Record<string, string> = { plus: "Plus" }

const capitalizeFirstLetter = (value: string): string => {
  const index = value.search(/[A-Za-zÀ-ÖØ-öø-ÿ]/)
  if (index < 0) return value
  return `${value.slice(0, index)}${value[index].toLocaleUpperCase("pt-BR")}${value.slice(index + 1)}`
}

const normalizeWord = (word: string, first: boolean): string => {
  const lower = word.toLocaleLowerCase("pt-BR")
  const corrected = ACCENTED_TERMS[lower] ?? PROPER_TERMS[lower] ?? lower
  return first ? capitalizeFirstLetter(corrected) : corrected
}

/**
 * Produces a deterministic display-only title without changing source IDs,
 * handles, SKUs, or the original Omie value.
 */
export const normalizeProductDisplayName = (
  input: string,
  protectedTerms: readonly string[] = [],
): string => {
  const source = input.trim().replace(/\s+/g, " ").replace(/\s+([,.;:!?])/g, "$1")
  if (!source) return ""

  const protectedValues = [...new Set(protectedTerms.map((term) => term.trim()).filter(Boolean))]
    .sort((left, right) => right.length - left.length)
  const placeholders = new Map<string, string>()
  let protectedSource = source
  protectedValues.forEach((term, index) => {
    const placeholder = `__FF_TERM_${index}__`
    const pattern = new RegExp(`(^|[^\\p{L}\\p{N}])(${term.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")})(?=$|[^\\p{L}\\p{N}])`, "giu")
    protectedSource = protectedSource.replace(pattern, (_match, prefix: string, value: string) => {
      placeholders.set(placeholder, term)
      return `${prefix}${placeholder}`
    })
  })

  let seenWord = false
  const normalized = protectedSource
    .split(/(\s+|[(),.;:!?])/)
    .map((part) => {
      if (!part || /^\s+$/.test(part) || /^[(),.;:!?]$/.test(part)) return part
      if (placeholders.has(part)) return placeholders.get(part) ?? part
      const value = normalizeWord(part, !seenWord)
      seenWord = true
      return value
    })
    .join("")

  return normalized.replace(/\s+([,.;:!?])/g, "$1")
}
