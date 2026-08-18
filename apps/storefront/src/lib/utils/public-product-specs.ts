import type { HttpTypes } from "@medusajs/types"

type PublicSpec = { label: string; value: string }

// Only buyer-facing catalog attributes belong in the public product contract.
// Internal synchronization and commercial-control metadata must never be rendered.
const PUBLIC_SPEC_KEYS: Array<[string, string[]]> = [
  ["Marca", ["brand", "manufacturer"]],
  ["Modelo", ["model", "modelo"]],
  ["Voltagem", ["voltage", "voltagem"]],
  ["Potência", ["power", "potencia", "potência"]],
  ["Capacidade", ["capacity", "capacidade"]],
  ["Gás refrigerante", ["refrigerant", "refrigerant_gas", "gas_refrigerante"]],
  ["Aplicação", ["application", "aplicacao", "aplicação"]],
  ["Tecnologia", ["technology", "tecnologia"]],
  ["Diâmetro", ["diameter", "diametro", "diâmetro"]],
  ["Pressão", ["pressure", "pressao", "pressão"]],
  ["Temperatura de trabalho", ["operating_temperature", "working_temperature", "temperatura"]],
  ["Dimensões", ["dimensions", "dimensoes", "dimensões"]],
  ["Peso", ["weight", "peso"]],
  ["Material", ["material"]],
  ["Compatibilidade", ["compatibility", "compatibilidade"]],
  ["Conteúdo da embalagem", ["package_contents", "conteudo_embalagem", "conteúdo_embalagem"]],
  ["Garantia", ["warranty", "garantia"]],
]

function formatPublicValue(value: unknown): string | null {
  if (typeof value === "string" || typeof value === "number") {
    const normalized = String(value).trim()
    return normalized ? normalized : null
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não"
  }

  return null
}

export function getPublicProductSpecs(product: HttpTypes.StoreProduct): PublicSpec[] {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const productFields = product as unknown as Record<string, unknown>
  const specs: PublicSpec[] = []

  for (const [label, aliases] of PUBLIC_SPEC_KEYS) {
    const key = aliases.find((candidate) => Object.prototype.hasOwnProperty.call(metadata, candidate))
    const source = key ? metadata : productFields
    const resolvedKey = key || aliases.find((candidate) => Object.prototype.hasOwnProperty.call(productFields, candidate))
    if (!resolvedKey) continue
    const value = formatPublicValue(source[resolvedKey])
    if (value) specs.push({ label, value })
  }

  return specs
}

export function getPublicProductDocuments(product: HttpTypes.StoreProduct): Array<{ name: string; url: string }> {
  const documents = (product.metadata as Record<string, unknown> | undefined)?.documents
  if (!Array.isArray(documents)) return []

  return documents.flatMap((document) => {
    if (!document || typeof document !== "object") return []
    const candidate = document as { name?: unknown; url?: unknown }
    if (typeof candidate.url !== "string" || !candidate.url.startsWith("https://")) return []
    return [{
      name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : "Documento técnico",
      url: candidate.url,
    }]
  })
}
