import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { siteFeatures } from "../../src/config/site-features"

const desktopNavSource = readFileSync(
  new URL("../../src/components/header/HeaderDesktopNav.tsx", import.meta.url),
  "utf8"
)
const mobileDrawerSource = readFileSync(
  new URL("../../src/components/header/HeaderMobileDrawer.tsx", import.meta.url),
  "utf8"
)
const publicHomeSource = readFileSync(
  new URL("../../src/pages/public-home.tsx", import.meta.url),
  "utf8"
)
const quemSomosSource = readFileSync(
  new URL("../../src/pages/quem-somos.tsx", import.meta.url),
  "utf8"
)
const quemSomosRouteSource = readFileSync(
  new URL("../../src/routes/quem-somos.tsx", import.meta.url),
  "utf8"
)
const publicStoresSource = readFileSync(
  new URL("../../src/pages/public-stores.tsx", import.meta.url),
  "utf8"
)
const rollbackDocSource = readFileSync(
  new URL("../../../../docs/rollbacks/HOMEPAGE-INSTITUTIONAL-ROLLBACK.md", import.meta.url),
  "utf8"
)

test("siteFeatures defines all institutional flags with safe fail-closed defaults", () => {
  assert.equal(siteFeatures.institutionalHome, true)
  assert.equal(siteFeatures.showHomeProductShowcase, false)
  assert.equal(siteFeatures.showHomeCategories, false)
  assert.equal(siteFeatures.showHomeBenefits, false)
  assert.equal(siteFeatures.showHomeBrandCarousel, false)
  assert.equal(siteFeatures.showHeaderProductNavigation, false)
  assert.equal(siteFeatures.showHeaderApplicationsNavigation, false)
  assert.equal(siteFeatures.showEmbeddedStoreMap, false)
  assert.equal(siteFeatures.showCommerceActions, false)
})

test("desktop header prioritizes Quem Somos then Nossas lojas", () => {
  const quemSomosIdx = desktopNavSource.indexOf('to="/quem-somos"')
  const lojasIdx = desktopNavSource.indexOf('to="/nossa-loja"')
  assert.ok(quemSomosIdx > 0, "Quem Somos link must be present")
  assert.ok(lojasIdx > 0, "Nossas lojas link must be present")
  assert.ok(quemSomosIdx < lojasIdx, "Quem Somos must precede Nossas lojas")
  assert.match(desktopNavSource, /siteFeatures\.showHeaderProductNavigation/)
  assert.match(desktopNavSource, /Marketplace preservado/)
})

test("mobile drawer exposes institutional links and wraps commercial categories", () => {
  assert.match(mobileDrawerSource, /to="\/quem-somos"/)
  assert.match(mobileDrawerSource, /to="\/nossa-loja"/)
  assert.match(mobileDrawerSource, /siteFeatures\.showHeaderProductNavigation/)
  assert.match(mobileDrawerSource, /Marketplace preservado/)
})

test("public home displays institutional hero, story, stores and contact", () => {
  assert.match(publicHomeSource, /<HeroSection \/>/)
  assert.match(publicHomeSource, /<HomeInstitutionalStory \/>/)
  assert.match(publicHomeSource, /<HomeStoreLocations \/>/)
  assert.match(publicHomeSource, /<HomeInstitutionalContact \/>/)
  assert.match(publicHomeSource, /siteFeatures\.showHomeBenefits && <HomePromotionalBanners/)
  assert.match(publicHomeSource, /siteFeatures\.showHomeBenefits && <HomeCommercialBenefits/)
  assert.match(publicHomeSource, /siteFeatures\.showHomeProductShowcase && <HomeProductSections/)
  assert.match(publicHomeSource, /siteFeatures\.showHomeCategories && <FeaturedCategories/)
  assert.match(publicHomeSource, /Marketplace preservado/)
})

test("quem-somos incorporates the complete official client history", () => {
  assert.match(quemSomosSource, /Paulo Neulaender, carinhosamente conhecido como Paulinho/)
  assert.match(quemSomosSource, /45 anos de atuação no mercado/)
  assert.match(quemSomosSource, /consultor nacional e internacional das Nações Unidas/)
  assert.match(quemSomosSource, /eliminação de CFCs e HCFCs/)
  assert.match(quemSomosSource, /diretoria da ABRAVA/)
  assert.match(quemSomosSource, /Câmara Ambiental de Refrigeração e Ar-Condicionado da CETESB/)
  assert.match(quemSomosSource, /Pioneirismo e responsabilidade ambiental/)
  assert.match(quemSomosSource, /recolhimento, recuperação e reciclagem/)
  assert.match(quemSomosSource, /centrais de regeneração/)
  assert.match(quemSomosSource, /Conhecimento que se transforma em soluções/)
  assert.match(quemSomosSource, /Um legado que continua evoluindo/)
  assert.match(quemSomosRouteSource, /pageMeta/)
})

test("public stores conditionally toggles embedded map while keeping cards and directions", () => {
  assert.match(publicStoresSource, /siteFeatures\.showEmbeddedStoreMap/)
  assert.match(publicStoresSource, /<GoogleStoreMap/)
  assert.match(publicStoresSource, /Como chegar/)
})

test("rollback guide documents base commit, feature flags and reactivation steps", () => {
  assert.match(rollbackDocSource, /48ba71f332d87b66d7e7ec2235ec6d5a5b67099f/)
  assert.match(rollbackDocSource, /backup\/pre-institutional-homepage/)
  assert.match(rollbackDocSource, /siteFeatures/)
  assert.match(rollbackDocSource, /Como Reativar o Marketplace Gradualmente/)
})
