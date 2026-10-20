/**
 * Feature flags centralizadas para a fase de apresentação institucional e preservação do marketplace.
 *
 * Para reativar os componentes comerciais no futuro, consulte:
 * docs/rollbacks/HOMEPAGE-INSTITUTIONAL-ROLLBACK.md
 */
export const siteFeatures = {
  /**
   * Home institucional com Hero simplificado, apresentação Quem Somos,
   * apresentação Nossas Lojas e encerramento de contato.
   */
  institutionalHome: true,

  /**
   * Exibição de vitrines e prateleiras de produtos na Home
   * (produtos especializados, recentes, ofertas).
   */
  showHomeProductShowcase: false,

  /**
   * Exibição de carrossel e grid de categorias na Home.
   */
  showHomeCategories: false,

  /**
   * Exibição de banners promocionais e cards de benefícios comerciais na Home
   * (10x sem juros, retirada na loja, etc.).
   */
  showHomeBenefits: false,

  /**
   * Exibição do carrossel de marcas na Home.
   */
  showHomeBrandCarousel: false,

  /**
   * Exibição do Megamenu de Produtos e links de categorias no Header.
   */
  showHeaderProductNavigation: false,

  /**
   * Exibição de navegação de aplicações no Header.
   */
  showHeaderApplicationsNavigation: false,

  /**
   * Exibição de mapas interativos incorporados (Google Maps iframe) na página de lojas.
   */
  showEmbeddedStoreMap: false,

  /**
   * Exibição de ações comerciais diretas no Header (ex: botão do carrinho).
   */
  showCommerceActions: false,
} as const

export type SiteFeatures = typeof siteFeatures
