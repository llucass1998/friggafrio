import { config as catalogConfig } from "./catalog/page"
import { config as overviewConfig } from "./overview/page"
import { config as omieProductsConfig } from "./omie-products/page"
import { config as quotesConfig } from "./quotes/page"
import { config as companiesConfig } from "./companies/page"
import { config as reviewsConfig } from "./product-reviews/page"

describe("Admin UI route configurations and Portuguese labels", () => {
  it("catalog route is top-ranked below search and labeled in Portuguese", () => {
    expect(catalogConfig.label).toBe("Gestão de Catálogo")
    expect(catalogConfig.rank).toBe(0)
    expect(catalogConfig.icon).toBeDefined()
  })

  it("overview route is ranked after catalog and labeled in Portuguese", () => {
    expect(overviewConfig.label).toBe("Visão Geral FriggaFrio")
    expect(overviewConfig.rank).toBe(1)
    expect(overviewConfig.icon).toBeDefined()
  })

  it("omie-products route is ranked second and labeled with correct accents", () => {
    expect(omieProductsConfig.label).toBe("Buscar Código FriggaFrio / Omie")
    expect(omieProductsConfig.rank).toBe(2)
  })

  it("quotes route is ranked third and labeled Cotações", () => {
    expect(quotesConfig.label).toBe("Cotações")
    expect(quotesConfig.rank).toBe(3)
  })

  it("companies route is ranked fourth and labeled Empresas", () => {
    expect(companiesConfig.label).toBe("Empresas")
    expect(companiesConfig.rank).toBe(4)
  })

  it("reviews route is ranked fifth and labeled Avaliações de Produtos", () => {
    expect(reviewsConfig.label).toBe("Avaliações de Produtos")
    expect(reviewsConfig.rank).toBe(5)
  })
})
