import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const card = readFileSync(new URL("../../src/components/public-product-card.tsx", import.meta.url), "utf8")
const detail = readFileSync(new URL("../../src/components/product-actions.tsx", import.meta.url), "utf8")
const shipping = readFileSync(new URL("../../src/components/shipping-estimate.tsx", import.meta.url), "utf8")
const home = readFileSync(new URL("../../src/pages/public-home.tsx", import.meta.url), "utf8")
const benefits = readFileSync(new URL("../../src/components/home/HomeCommercialBenefits.tsx", import.meta.url), "utf8")
const banners = readFileSync(new URL("../../src/components/home/HomePromotionalBanners.tsx", import.meta.url), "utf8")
const store = readFileSync(new URL("../../src/pages/store.tsx", import.meta.url), "utf8")
const catalogStyles = readFileSync(new URL("../../src/styles/app.css", import.meta.url), "utf8")
const productPage = readFileSync(new URL("../../src/pages/product.tsx", import.meta.url), "utf8")
const productReviews = readFileSync(new URL("../../src/components/product-reviews.tsx", import.meta.url), "utf8")
const imageGallery = readFileSync(new URL("../../src/components/ui/image-gallery.tsx", import.meta.url), "utf8")
const publicLayout = readFileSync(new URL("../../src/components/public-layout.tsx", import.meta.url), "utf8")

test("Product Card renders quote-only and pending states as factual PDP links", () => {
  assert.match(card, /purchaseState\.status === "quote_only"/)
  assert.match(card, /Sob cota/)
  assert.match(card, /purchaseState\.status === "price_pending"/)
  assert.match(card, /Valor em configura/)
  assert.match(card, /Consulte o valor/)
  assert.doesNotMatch(card, /Adicionar ao carrinho/)
  assert.doesNotMatch(card, /useAddToCart/)
  assert.match(card, /getInterestFreeInstallment\(displayPrice\)/)
})

test("Product Card does not render a pending calculated price", () => {
  const pendingBranch = card.match(/purchaseState\.status === "price_pending" \? \([\s\S]*?\) : purchaseState\.status === "out_of_stock"/)
  assert.ok(pendingBranch, "expected an explicit price_pending presentation branch")
  assert.doesNotMatch(pendingBranch[0], /formatCurrencyAmount/)
})

test("Product Detail routes quote and pending states through consultative actions", () => {
  assert.match(detail, /const quoteState = purchaseState\.status === "quote_only" \|\| purchaseState\.status === "price_pending"/)
  assert.match(detail, /Sob orçamento/)
  assert.match(detail, /Preço sob consulta/)
  assert.match(detail, /Solicitar orçamento/)
  assert.match(detail, /Falar com um especialista/)
  assert.match(detail, /canBuySelected/)
})

test("Product Detail does not format a calculated price for pending states", () => {
  assert.match(detail, /const displayPrice = selectedVariant\?\.calculated_price\?\.calculated_amount/)
  assert.match(detail, /purchaseState\.status === "purchasable" \? purchaseState\.price : undefined/)
  assert.match(detail, /quoteState \? \(/)
  assert.match(detail, /formattedPrice = typeof displayPrice === "number" && displayPrice > 0/)
  assert.doesNotMatch(detail, /getInterestFreeInstallment\(displayPrice\)/)
  assert.doesNotMatch(detail, /sem juros/)
})

test("commercial benefits are exclusive to the homepage and replace the old banner block", () => {
  assert.match(home, /HomeCommercialBenefits/)
  assert.match(home, /HomePromotionalBanners/)
  assert.match(benefits, /Até 10x sem juros/)
  assert.match(benefits, /Retirada na loja/)
  assert.match(benefits, /Atendimento técnico/)
  assert.match(benefits, /Compra segura/)
  assert.match(benefits, /grid-cols-2/)
  assert.match(benefits, /lg:grid-cols-4/)
  assert.doesNotMatch(publicLayout, /HomeCommercialBenefits/)
})

test("homepage keeps category banners before commercial benefits and product shelves", () => {
  assert.match(banners, /ferramentas-manutencao/)
  assert.match(banners, /gases-refrigerantes/)
  assert.match(banners, /tubos-cobres/)
  const heroIndex = home.indexOf("<HeroSection")
  const bannerIndex = home.indexOf("<HomePromotionalBanners")
  const benefitsIndex = home.indexOf("<HomeCommercialBenefits")
  const productsIndex = home.indexOf("<HomeProductSections")
  assert.ok(heroIndex >= 0 && heroIndex < bannerIndex)
  assert.ok(bannerIndex < benefitsIndex)
  assert.ok(benefitsIndex < productsIndex)
  assert.match(banners, /useEmblaCarousel\(\{[\s\S]*loop: false/)
  assert.match(banners, /\(min-width: 768px\).*active: false/)
  assert.match(banners, /className="[^"]*flex touch-pan-y md:grid md:grid-cols-3/)
  assert.match(banners, /className="overflow-hidden md:overflow-visible"/)
  assert.match(banners, /aria-label="[^"]*banners"/)
  assert.match(banners, /aria-current=\{active \? "true" : "false"\}/)
})

test("catalog filters keep state in the URL and expose an accessible mobile flow", () => {
  assert.match(store, /searchParams\?\.q/)
  assert.match(store, /OPTION_VALUE_QUERY_KEY/)
  assert.match(store, /role=\{mobileFiltersOpen \? "dialog" : undefined\}/)
  assert.match(store, /event\.key === "Escape"/)
  assert.match(store, /aria-label="Filtros ativos"/)
  assert.match(store, /Limpar tudo/)
  assert.match(store, /Ver \{count\}/)
  assert.match(store, /min-\[1280px\]:grid-cols-4/)
  assert.match(store, /lg:grid-cols-\[250px_minmax\(0,1fr\)\]/)
  assert.match(catalogStyles, /@media \(min-width: 1280px\)[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/)
  assert.match(catalogStyles, /grid-template-columns: 250px minmax\(0, 1fr\)/)
  assert.match(store, /data-testid="catalog-layout" className="catalog-layout/)
  assert.match(store, /data-testid="catalog-main" className="catalog-main/)
  assert.match(store, /data-testid="catalog-toolbar" className="catalog-toolbar/)
  assert.match(store, /data-testid="catalog-filter-sidebar"/)
  assert.match(store, /data-testid="store-product-grid"/)
})

test("PDP does not render an empty description panel", () => {
  assert.match(productPage, /const hasDescription = Boolean\(productDescription\.trim\(\)\)/)
  assert.match(productPage, /const hasOverview = Boolean\(hasDescription \|\| publicSpecs\.length > 0/)
  assert.match(productPage, /detailSections\.length > 0/)
})

test("PDP template is data-driven and not tied to a product SKU", () => {
  assert.doesNotMatch(productPage, /AS204|Separador liq\.|5355643802/)
  assert.match(productPage, /product\.title/)
  assert.match(productPage, /product\.images/)
  assert.match(productPage, /product\.variants/)
  assert.match(productPage, /<RelatedProducts/)
})

test("PDP only exposes variant choices for multiple real variants", () => {
  assert.match(productPage, /const hasSelectableVariants = \(product\.variants\?\.length \?\? 0\) > 1 && Boolean\(product\.options\?\.length\)/)
  assert.match(productPage, /data-has-selectable-variants=\{hasSelectableVariants\}/)
  assert.match(detail, /\(product\.variants\?\.length \?\? 0\) > 1/)
})

test("PDP technical panels use accessible tabs", () => {
  assert.match(productPage, /role=\"tablist\"/)
  assert.match(productPage, /role=\"tab\"/)
  assert.match(productPage, /role=\"tabpanel\"/)
  assert.match(productPage, /aria-selected=\{selectedDetailId === section\.id\}/)
  assert.match(productPage, /tabIndex=\{selectedDetailId === section\.id \? 0 : -1\}/)
  assert.match(productPage, /data-testid="product-top-layout"/)
  assert.match(productPage, /data-testid="product-columns"/)
  assert.match(productPage, /className="product-top-columns grid grid-cols-1 items-start gap-4"/)
  assert.match(productPage, /data-testid="purchase-panel"/)
  assert.match(detail, /data-testid="product-purchase-actions"/)
  assert.match(detail, /sm:grid-cols-\[135px_minmax\(0,1fr\)\]/)
  assert.match(detail, /Comprar pelo WhatsApp/)
  assert.match(detail, /Retirada na loja/)
  assert.match(detail, /Atendimento técnico/)
  assert.match(detail, /Compra segura/)
  assert.match(shipping, /Calcule a entrega/)
  assert.match(productPage, /Resumo técnico/)
  assert.match(productPage, /Visão geral/)
  assert.match(productPage, /Sobre o produto/)
  assert.match(productPage, /Especificações técnicas/)
})

test("PDP review empty state follows the reference card without fake ratings", () => {
  assert.match(productReviews, /data-testid="product-review-empty"/)
  assert.match(productReviews, /Seja o primeiro a avaliar e compartilhe sua experiência\./)
  assert.doesNotMatch(productReviews, /Compra verificada.*total === 0/)
})

test("PDP gallery reveals SSR-loaded media after hydration", () => {
  assert.match(imageGallery, /data-gallery-image-id={image\.id}/)
  assert.match(imageGallery, /image\.complete && image\.naturalWidth > 0/)
})

test("PDP keeps delivery before the compact trust arguments", () => {
  const shippingIndex = productPage.indexOf("<ShippingEstimate")
  const trustIndex = productPage.indexOf("<ProductTrustArguments")
  assert.ok(shippingIndex >= 0 && trustIndex >= 0 && shippingIndex < trustIndex)
  assert.match(detail, /afterActions\?: ReactNode/)
  assert.match(productPage, /afterActions=\{<>/)
})

test("related PDP cards expose verified installment policy", () => {
  const related = readFileSync(new URL("../../src/components/related-products.tsx", import.meta.url), "utf8")
  assert.match(related, /showInstallment=\{true\}/)
})

test("catalog cards keep the approved card component while using the reference density", () => {
  assert.match(store, /<PublicProductCard[\s\S]*catalog\s*\/>/)
  assert.match(card, /aspect-\[4\/3\]/)
  assert.doesNotMatch(card, /Adicionar ao carrinho/)
})

test("home product shelves request only fields used by compact public cards", () => {
  const fields = readFileSync(new URL("../../src/lib/data/product-fields.ts", import.meta.url), "utf8")
  const homeFields = fields.match(/PUBLIC_HOME_PRODUCT_FIELDS[\s\S]*?\n\n/)?.[0] ?? ""
  assert.match(homeFields, /id,title,handle,thumbnail/)
  assert.doesNotMatch(homeFields, /description/)
  assert.doesNotMatch(homeFields, /variants\.options/)
})
