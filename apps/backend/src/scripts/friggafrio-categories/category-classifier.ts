import { CanonicalCategoryHandle, ProductCategoryClassification } from "./types"
import { normalizeText } from "./normalize-text"
import { checkTextRules } from "./category-rules"

export function classifyProduct(product: any): ProductCategoryClassification {
  const currentCategoryHandles = product.categories?.map((c: any) => c.handle) || []
  const currentCategoryIds = product.categories?.map((c: any) => c.id) || []
  const title = product.title || ""
  const skus = product.variants?.map((v: any) => v.sku).filter(Boolean) || []
  const metadata = product.metadata || {}
  const sourceSheet = metadata.source_sheet ? String(metadata.source_sheet).toUpperCase() : null
  
  const normalizedTitle = normalizeText(title)
  const normalizedDesc = normalizeText(product.description || "")
  const combinedText = `${normalizedTitle} ${normalizedDesc}`

  const result: ProductCategoryClassification = {
    productId: product.id,
    title,
    skus,
    currentCategoryIds,
    proposedCategoryHandle: null,
    confidence: "NONE",
    matchedRules: [],
    action: "UNMAPPED",
    reason: "Não mapeado"
  }

  // 1. Categoria já vinculada corretamente
  if (currentCategoryHandles.length > 0) {
    // Check se alguma das categorias atuais é uma das canônicas
    const validHandles = [
      "gases-refrigerantes", "compressores", "camara-fria-condensacao",
      "valvulas-controles", "ferramentas-equipamentos", "instalacao-isolamento",
      "oleos-produtos-quimicos", "cilindros-recolhimento", "quadros-automacao"
    ]
    const matchedValidHandle = currentCategoryHandles.find((h: string) => validHandles.includes(h))
    
    if (matchedValidHandle) {
      result.proposedCategoryHandle = matchedValidHandle as CanonicalCategoryHandle
      result.confidence = "EXPLICIT"
      result.action = "ALREADY_LINKED"
      result.reason = `Já vinculado à categoria: ${matchedValidHandle}`
      return result
    }
  }

  const candidateHandles = new Set<CanonicalCategoryHandle>()
  const reasons: string[] = []

  // 2. Metadata source_sheet
  if (sourceSheet) {
    if (sourceSheet === "GAS") {
      candidateHandles.add("gases-refrigerantes")
      reasons.push("source_sheet=GAS")
    } else if (sourceSheet === "COBRE") {
      candidateHandles.add("instalacao-isolamento")
      reasons.push("source_sheet=COBRE")
    } else if (sourceSheet === "EMBRACO" || sourceSheet === "TECUMSEH") {
      if (checkTextRules(combinedText).includes("compressores")) {
        candidateHandles.add("compressores")
        reasons.push(`source_sheet=${sourceSheet} + keywords`)
      }
    }
  }

  // 3. Regras textuais
  const textMatches = checkTextRules(combinedText)
  if (textMatches.length > 0) {
    textMatches.forEach(h => candidateHandles.add(h))
    reasons.push(`Keywords matched: ${textMatches.join(", ")}`)
  }

  // Decisão
  const candidates = Array.from(candidateHandles)

  if (candidates.length === 1) {
    result.proposedCategoryHandle = candidates[0]
    result.matchedRules = reasons
    
    if (reasons.some(r => r.startsWith("source_sheet"))) {
      result.confidence = "HIGH"
    } else {
      result.confidence = "HIGH" // Regras textuais explícitas
    }
    
    result.action = "LINK_CATEGORY"
    result.reason = `Classificado via: ${reasons.join(" | ")}`
  } else if (candidates.length > 1) {
    result.confidence = "AMBIGUOUS"
    result.action = "CONFLICT"
    result.reason = `Múltiplas categorias candidatas: ${candidates.join(", ")}`
    result.matchedRules = reasons
  } else {
    // Unmapped
  }

  return result
}
