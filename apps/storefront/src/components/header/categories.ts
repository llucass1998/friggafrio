export type NavigationItem = {
  id: string
  label: string
  href: string
  description?: string
  children?: NavigationItem[]
}

// Keep this fallback navigation aligned with the categories persisted in Medusa.
// The desktop mega menu uses the live Store API; this list is used by the mobile drawer
// during the first render and must never point at synthetic category handles.
const persistedCategories: Array<[string, string, string]> = [
  ["bombas-de-vacuo", "Bombas de Vácuo", "/br/categories/bombas-de-vacuo"],
  ["camara-fria", "Câmara Fria", "/br/categories/camara-fria"],
  ["cilindros-de-recolhimento", "Cilindros de Recolhimento", "/br/categories/cilindros-de-recolhimento"],
  ["componentes", "Componentes", "/br/categories/componentes"],
  ["compressores", "Compressores", "/br/categories/compressores"],
  ["conexoes", "Conexões", "/br/categories/conexoes"],
  ["detectores-de-vazamento", "Detectores de Vazamento", "/br/categories/detectores-de-vazamento"],
  ["ferramentas-manuais", "Ferramentas Manuais", "/br/categories/ferramentas-manuais"],
  ["gases-refrigerantes", "Gases Refrigerantes", "/br/categories/gases-refrigerantes"],
  ["isolamento-termico", "Isolamento Térmico", "/br/categories/isolamento-termico"],
  ["manifolds-e-manometros", "Manifolds e Manômetros", "/br/categories/manifolds-e-manometros"],
  ["oleos", "Óleos", "/br/categories/oleos"],
  ["outros", "Outros", "/br/categories/outros"],
  ["produtos-quimicos", "Produtos Químicos", "/br/categories/produtos-quimicos"],
  ["recolhedoras", "Recolhedoras", "/br/categories/recolhedoras"],
  ["tubos-de-cobre", "Tubos de Cobre", "/br/categories/tubos-de-cobre"],
]

const persistedProductCategories: NavigationItem[] = persistedCategories.map(([id, label, href]) => ({
  id,
  label,
  href,
}))

export type CategorySection = {
  id: string
  label: string
  categoryIds: string[]
}

// Group the canonical categories so the mobile menu stays compact.
export const productCategorySections: CategorySection[] = [
  {
    id: "refrigeracao",
    label: "Refrigeração",
    categoryIds: ["bombas-de-vacuo", "camara-fria", "compressores", "gases-refrigerantes", "cilindros-de-recolhimento", "recolhedoras"],
  },
  {
    id: "componentes",
    label: "Componentes",
    categoryIds: ["componentes", "conexoes", "tubos-de-cobre", "isolamento-termico", "oleos"],
  },
  {
    id: "ferramentas",
    label: "Ferramentas e medição",
    categoryIds: ["detectores-de-vazamento", "ferramentas-manuais", "manifolds-e-manometros"],
  },
  {
    id: "outros",
    label: "Outros",
    categoryIds: ["outros", "produtos-quimicos"],
  },
]

const categoriesById = new Map(persistedProductCategories.map((category) => [category.id, category]))

export const getProductCategorySectionItems = (section: CategorySection): NavigationItem[] =>
  section.categoryIds.flatMap((id) => {
    const category = categoriesById.get(id)
    return category ? [category] : []
  })

export const productCategories: NavigationItem[] = productCategorySections.map((section) => ({
  id: section.id,
  label: section.label,
  href: "/br/store",
  children: getProductCategorySectionItems(section),
}))

export const applicationCategories: NavigationItem[] = []

export const mainNavigation: NavigationItem[] = [
  { id: "nav-gases", label: "Gases Refrigerantes", href: "/br/categories/gases-refrigerantes" },
  { id: "nav-compressores", label: "Compressores", href: "/br/categories/compressores" },
  { id: "nav-camara", label: "Câmara Fria", href: "/br/categories/camara-fria" },
  { id: "nav-ferramentas", label: "Ferramentas", href: "/br/categories/bombas-de-vacuo" },
]
