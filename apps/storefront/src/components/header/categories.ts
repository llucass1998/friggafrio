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

export const productCategories: NavigationItem[] = persistedCategories.map(([id, label, href]) => ({
  id,
  label,
  href,
}))

export const applicationCategories: NavigationItem[] = []

export const mainNavigation: NavigationItem[] = [
  { id: "nav-gases", label: "Gases Refrigerantes", href: "/br/categories/gases-refrigerantes" },
  { id: "nav-compressores", label: "Compressores", href: "/br/categories/compressores" },
  { id: "nav-camara", label: "Câmara Fria", href: "/br/categories/camara-fria" },
  { id: "nav-ferramentas", label: "Ferramentas", href: "/br/categories/bombas-de-vacuo" },
]
