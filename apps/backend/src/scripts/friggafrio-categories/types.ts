import { ProductDTO, ProductCategoryDTO } from "@medusajs/framework/types"

export type CanonicalCategoryHandle =
  | "gases-refrigerantes"
  | "compressores"
  | "camara-fria-condensacao"
  | "valvulas-controles"
  | "ferramentas-equipamentos"
  | "instalacao-isolamento"
  | "oleos-produtos-quimicos"
  | "cilindros-recolhimento"
  | "quadros-automacao"

export type ProductCategoryClassification = {
  productId: string
  title: string
  skus: string[]
  currentCategoryIds: string[]
  proposedCategoryHandle: CanonicalCategoryHandle | null
  confidence: "EXPLICIT" | "HIGH" | "MEDIUM" | "AMBIGUOUS" | "NONE"
  matchedRules: string[]
  action:
    | "LINK_CATEGORY"
    | "ALREADY_LINKED"
    | "UNMAPPED"
    | "CONFLICT"
    | "ERROR"
  reason: string
}

export type CategoryDefinition = {
  name: string
  handle: CanonicalCategoryHandle
  description?: string
  parent_category_id: null
}

export type AuditedMedusaState = {
  productsCount: number
  variantsCount: number
  skusCount: number
  categoriesExisting: number
  productsUnmapped: number
  productsSingleCategory: number
  productsMultiCategory: number
  productsArchived: number
  productsPublished: number
  productsDraft: number
}

export type CLIConfig = {
  dryRun: boolean
  apply: boolean
  confirm: string
  planSha?: string
}
