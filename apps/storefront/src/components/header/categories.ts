export type NavigationItem = {
  id: string
  label: string
  href: string
  description?: string
  children?: NavigationItem[]
}

export const productCategories: NavigationItem[] = [
  {
    id: "gases",
    label: "Gases Refrigerantes",
    href: "/br/store?category=gases-refrigerantes",
    children: [
      { id: "gases-all", label: "Ver todos os gases", href: "/br/store?category=gases-refrigerantes" },
      { id: "r600a", label: "R600a", href: "/br/store?q=R600a" },
      { id: "r134a", label: "R134a", href: "/br/store?q=R134a" },
      { id: "r290", label: "R290", href: "/br/store?q=R290" },
      { id: "r404a", label: "R404A", href: "/br/store?q=R404A" },
      { id: "r410a", label: "R410A", href: "/br/store?q=R410A" },
      { id: "r32", label: "R32", href: "/br/store?q=R32" },
      { id: "r22", label: "R22", href: "/br/store?q=R22" },
      { id: "r407c", label: "R407C", href: "/br/store?q=R407C" },
      { id: "r448a", label: "R448A", href: "/br/store?q=R448A" },
      { id: "r449a", label: "R449A", href: "/br/store?q=R449A" },
      { id: "r507a", label: "R507A", href: "/br/store?q=R507A" },
      { id: "r744", label: "R744 / CO₂", href: "/br/store?q=R744" },
    ],
  },
  {
    id: "compressores",
    label: "Compressores",
    href: "/br/store?category=compressores",
    children: [
      { id: "compressores-all", label: "Ver todos os compressores", href: "/br/store?category=compressores" },
      { id: "compressores-hermeticos", label: "Compressores herméticos", href: "/br/store?category=compressores-hermeticos" },
      { id: "compressores-rotativos", label: "Compressores rotativos", href: "/br/store?category=compressores-rotativos" },
      { id: "compressores-scroll", label: "Compressores scroll", href: "/br/store?category=compressores-scroll" },
      { id: "compressores-alternativos", label: "Compressores alternativos", href: "/br/store?category=compressores-alternativos" },
      { id: "compressores-semi", label: "Compressores semi-herméticos", href: "/br/store?category=compressores-semi" },
      { id: "compressores-ref", label: "Compressores para refrigeração", href: "/br/store?category=compressores-refrigeracao" },
      { id: "compressores-ac", label: "Compressores para ar-condicionado", href: "/br/store?category=compressores-ar" },
    ],
  },
  {
    id: "camara-fria",
    label: "Câmara Fria",
    href: "/br/store?category=camara-fria",
    children: [
      { id: "cf-all", label: "Produtos para câmara fria", href: "/br/store?category=camara-fria" },
      { id: "cf-unidades", label: "Unidades condensadoras", href: "/br/store?category=unidades-condensadoras" },
      { id: "cf-evaporadores", label: "Evaporadores", href: "/br/store?category=evaporadores" },
      { id: "cf-controladores", label: "Controladores de temperatura", href: "/br/store?category=controladores" },
      { id: "cf-expansao", label: "Válvulas de expansão", href: "/br/store?category=valvulas-expansao" },
      { id: "cf-solenoides", label: "Válvulas solenoides", href: "/br/store?category=valvulas-solenoides" },
      { id: "cf-filtros", label: "Filtros secadores", href: "/br/store?category=filtros-secadores" },
      { id: "cf-pressostatos", label: "Pressostatos", href: "/br/store?category=pressostatos" },
      { id: "cf-visores", label: "Visores de líquido", href: "/br/store?category=visores-liquido" },
      { id: "cf-resistencias", label: "Resistências", href: "/br/store?category=resistencias" },
      { id: "cf-paineis", label: "Painéis e acessórios", href: "/br/store?category=paineis-acessorios" },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas e Instalação",
    href: "/br/store?category=ferramentas",
    children: [
      { id: "tools-all", label: "Ver todas as ferramentas", href: "/br/store?category=ferramentas" },
      { id: "tools-bombas", label: "Bombas de vácuo", href: "/br/store?category=bombas-vacuo" },
      { id: "tools-manifolds", label: "Manifolds e manômetros", href: "/br/store?category=manifolds" },
      { id: "tools-detectores", label: "Detectores de vazamento", href: "/br/store?category=detectores-vazamento" },
      { id: "tools-recolhedoras", label: "Recolhedoras", href: "/br/store?category=recolhedoras" },
      { id: "tools-cilindros", label: "Cilindros de recolhimento", href: "/br/store?category=cilindros" },
      { id: "tools-tubos", label: "Tubos de cobre", href: "/br/store?category=tubos-cobre" },
      { id: "tools-conexoes", label: "Conexões", href: "/br/store?category=conexoes" },
      { id: "tools-isolamento", label: "Isolamento térmico", href: "/br/store?category=isolamento-termico" },
      { id: "tools-oleos", label: "Óleos", href: "/br/store?category=oleos" },
      { id: "tools-quimicos", label: "Produtos químicos", href: "/br/store?category=produtos-quimicos" },
      { id: "tools-manuais", label: "Ferramentas manuais", href: "/br/store?category=ferramentas-manuais" },
    ],
  },
]

export const applicationCategories: NavigationItem[] = [
  { id: "app-frigobar", label: "Frigobares e refrigeradores", href: "/br/store?aplicacao=frigobar" },
  { id: "app-camaras", label: "Câmaras frias", href: "/br/store?aplicacao=camaras-frias" },
  { id: "app-supermercados", label: "Supermercados", href: "/br/store?aplicacao=supermercados" },
  { id: "app-restaurantes", label: "Restaurantes", href: "/br/store?aplicacao=restaurantes" },
  { id: "app-hoteis", label: "Hotéis", href: "/br/store?aplicacao=hoteis" },
  { id: "app-farmacias", label: "Farmácias", href: "/br/store?aplicacao=farmacias" },
  { id: "app-industrias", label: "Indústrias", href: "/br/store?aplicacao=industrias" },
  { id: "app-tecnicos", label: "Técnicos e instaladores", href: "/br/store?aplicacao=tecnicos" },
]

export const mainNavigation: NavigationItem[] = [
  { id: "nav-gases", label: "Gases Refrigerantes", href: "/br/store?category=gases-refrigerantes" },
  { id: "nav-compressores", label: "Compressores", href: "/br/store?category=compressores" },
  { id: "nav-camara", label: "Câmara Fria", href: "/br/store?category=camara-fria" },
  { id: "nav-ferramentas", label: "Ferramentas", href: "/br/store?category=ferramentas" },
  { id: "nav-servicos", label: "Serviços", href: "/br/store?category=servicos" },
  { id: "nav-central", label: "Central Técnica", href: "/br/store?category=central-tecnica" },
]
