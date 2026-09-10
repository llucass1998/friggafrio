import type { HttpTypes } from "@medusajs/types"

export type PublicSpec = { label: string; value: string }

// Only buyer-facing catalog attributes belong in the public product contract.
// Internal synchronization and commercial-control metadata must never be rendered.
const PUBLIC_SPEC_KEYS: Array<[string, string[]]> = [
  ["Tipo", ["type", "tipo", "product_type", "categoria"]],
  ["Conexão", ["connection", "conexao", "conexão"]],
  ["Modelo", ["model", "modelo"]],
  ["Aplicação", ["application", "aplicacao", "aplicação"]],
  ["Marca", ["brand", "marca", "manufacturer", "fabricante"]],
  ["Linha de sucção", ["suction_line", "suctionLine", "linha_succao", "linha_de_succao", "linha de sucção"]],
  ["Voltagem", ["voltage", "voltagem"]],
  ["Potência", ["power", "potencia", "potência"]],
  ["Capacidade", ["capacity", "capacidade"]],
  ["Gás refrigerante", ["refrigerant", "refrigerant_gas", "gas_refrigerante"]],
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

  const title = (product.title ?? "").trim()
  const firstVariant = product.variants?.[0]
  const sku = firstVariant?.sku?.trim() || null

  // Fallback inferences for key attributes if absent in metadata
  const fallbackType = formatPublicValue(
    product.type?.value || product.categories?.[0]?.name || null
  )

  let fallbackConnection: string | null = null
  const connMatch = title.match(/(?:\d+(?:\.\d+)?\s*(?:\/\s*\d+)?\s*(?:[xX]|-)?\s*)+(?:\d+(?:\.\d+)?\s*(?:\/\s*\d+)?\s*(?:[SRs]|POL|")?)/)
  if (connMatch && connMatch[0]?.trim()) {
    fallbackConnection = connMatch[0].trim()
  }

  const fallbackModel = formatPublicValue(sku || null)
  const fallbackApp = formatPublicValue(getPublicProductApplication(product) || "Sistemas de refrigeração e climatização")
  const fallbackBrand = formatPublicValue(
    product.collection?.title || metadata.brand || metadata.manufacturer || "FriggaFrio"
  )

  for (const [label, aliases] of PUBLIC_SPEC_KEYS) {
    const key = aliases.find((candidate) => Object.prototype.hasOwnProperty.call(metadata, candidate))
    const source = key ? metadata : productFields
    const resolvedKey = key || aliases.find((candidate) => Object.prototype.hasOwnProperty.call(productFields, candidate))
    let value = resolvedKey ? formatPublicValue(source[resolvedKey]) : null

    if (!value) {
      if (label === "Tipo") value = fallbackType
      else if (label === "Conexão") value = fallbackConnection
      else if (label === "Modelo") value = fallbackModel
      else if (label === "Aplicação") value = fallbackApp
      else if (label === "Marca") value = fallbackBrand
    }

    if (value) specs.push({ label, value })
  }

  // If Material is missing but title mentions Cobre
  if (!specs.some((s) => s.label === "Material") && /cobre/i.test(title)) {
    specs.push({ label: "Material", value: "Cobre" })
  }

  return specs
}

export function getPublicProductApplication(product: HttpTypes.StoreProduct): string | null {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const val = metadata.application || metadata.aplicacao || metadata.aplicação
  if (typeof val === "string" && val.trim()) return val.trim()
  return null
}

export function getPublicProductCompatibility(product: HttpTypes.StoreProduct): string | null {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const val = metadata.compatibility || metadata.compatibilidade
  if (typeof val === "string" && val.trim()) return val.trim()
  return null
}

export function getPublicProductPackageContents(product: HttpTypes.StoreProduct): string[] | null {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const raw = metadata.package_contents || metadata.conteudo_embalagem || metadata.conteúdo_embalagem || metadata.itens_inclusos
  if (Array.isArray(raw)) {
    const items = raw.map((i) => String(i).trim()).filter(Boolean)
    return items.length > 0 ? items : null
  }
  if (typeof raw === "string" && raw.trim()) {
    const items = raw.split(/\n|•|;/).map((i) => i.trim()).filter(Boolean)
    return items.length > 0 ? items : null
  }
  return null
}

export function getPublicProductDocuments(product: HttpTypes.StoreProduct): Array<{ name: string; url: string; format?: string; size?: string }> {
  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const documents = metadata.documents
  const docs: Array<{ name: string; url: string; format?: string; size?: string }> = []

  if (Array.isArray(documents)) {
    for (const document of documents) {
      if (!document || typeof document !== "object") continue
      const candidate = document as { name?: unknown; url?: unknown; format?: unknown; size?: unknown }
      if (typeof candidate.url !== "string" || !candidate.url.startsWith("https://")) continue
      docs.push({
        name: typeof candidate.name === "string" && candidate.name.trim() ? candidate.name.trim() : "Documento técnico",
        url: candidate.url,
        ...(typeof candidate.format === "string" && candidate.format.trim() ? { format: candidate.format.trim() } : {}),
        ...(typeof candidate.size === "string" && candidate.size.trim() ? { size: candidate.size.trim() } : {}),
      })
    }
  }

  // Check direct document fields in metadata
  const directPdfUrl = metadata.pdf_url || metadata.document_url || metadata.ficha_tecnica_url || metadata.manual_url
  if (typeof directPdfUrl === "string" && directPdfUrl.startsWith("https://")) {
    const alreadyExists = docs.some((d) => d.url === directPdfUrl)
    if (!alreadyExists) {
      const directTitle = metadata.pdf_title || metadata.document_title || metadata.ficha_tecnica_title || metadata.manual_title
      docs.push({
        name: typeof directTitle === "string" && directTitle.trim() ? directTitle.trim() : "Manual / Ficha Técnica (PDF)",
        url: directPdfUrl,
        format: "PDF",
      })
    }
  }

  return docs
}
