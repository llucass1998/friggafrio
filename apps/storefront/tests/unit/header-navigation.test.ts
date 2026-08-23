import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const mobileDrawerSource = readFileSync(
  new URL("../../src/components/header/HeaderMobileDrawer.tsx", import.meta.url),
  "utf8"
)
const stickyHeaderSource = readFileSync(
  new URL("../../src/components/header/StickyCommerceHeader.tsx", import.meta.url),
  "utf8"
)
const productsMenuSource = readFileSync(
  new URL("../../src/components/header/ProductsMegaMenu.tsx", import.meta.url),
  "utf8"
)
const accessibilityTopBarSource = readFileSync(
  new URL("../../src/components/accessibility/AccessibilityTopBar.tsx", import.meta.url),
  "utf8"
)
const productPageSource = readFileSync(
  new URL("../../src/pages/product.tsx", import.meta.url),
  "utf8"
)
const productActionsSource = readFileSync(
  new URL("../../src/components/product-actions.tsx", import.meta.url),
  "utf8"
)
const helpPageSource = readFileSync(
  new URL("../../src/pages/support/ajuda.tsx", import.meta.url),
  "utf8"
)
const accessibilityButtonSource = readFileSync(
  new URL("../../src/components/accessibility/AccessibilityFloatingButton.tsx", import.meta.url),
  "utf8"
)
const accessibilityProviderSource = readFileSync(
  new URL("../../src/components/accessibility/AccessibilityProvider.tsx", import.meta.url),
  "utf8"
)
const accessibilityPanelSource = readFileSync(
  new URL("../../src/components/accessibility/AccessibilityPanel.tsx", import.meta.url),
  "utf8"
)
const newsletterSource = readFileSync(
  new URL("../../src/components/newsletter-signup.tsx", import.meta.url),
  "utf8"
)
const publicLayoutSource = readFileSync(
  new URL("../../src/components/public-layout.tsx", import.meta.url),
  "utf8"
)
const publicHomeSource = readFileSync(
  new URL("../../src/pages/public-home.tsx", import.meta.url),
  "utf8"
)
const productCardSource = readFileSync(
  new URL("../../src/components/public-product-card.tsx", import.meta.url),
  "utf8"
)
const fullHeaderSource = readFileSync(
  new URL("../../src/components/header/FullStoreHeader.tsx", import.meta.url),
  "utf8"
)

test("mobile navigation exposes an accessible open/close flow", () => {
  assert.match(mobileDrawerSource, /aria-expanded=\{isOpen\}/)
  assert.match(mobileDrawerSource, /aria-controls="mobile-navigation-drawer"/)
  assert.match(mobileDrawerSource, /role="dialog"/)
  assert.match(mobileDrawerSource, /event\.key === "Escape"/)
  assert.match(mobileDrawerSource, /data-testid="mobile-navigation-overlay"/)
  assert.match(mobileDrawerSource, /data-testid="mobile-navigation-close"/)
  assert.match(mobileDrawerSource, /document\.body\.style\.overflow = "hidden"/)
  assert.match(mobileDrawerSource, /document\.body\.style\.overflow = previousOverflowRef\.current/)
  assert.match(mobileDrawerSource, /createPortal\(drawer, document\.body\)/)
  assert.match(mobileDrawerSource, /const \[isMounted, setIsMounted\]/)
  assert.match(mobileDrawerSource, /onTransitionEnd=\{handleDrawerTransitionEnd\}/)
  assert.match(mobileDrawerSource, /motion-duration-menu-open/)
  assert.match(mobileDrawerSource, /motion-duration-menu-close/)
  assert.match(mobileDrawerSource, /const openDrawer = \(\) => \{\s*setIsMounted\(true\)\s*setIsOpen\(true\)/)
  assert.doesNotMatch(mobileDrawerSource, /openFrameRef/)
  assert.match(mobileDrawerSource, /data-hydrated=\{isHydrated \? "true" : "false"\}/)
})

test("mobile navigation has canonical links and no duplicate action group", () => {
  assert.match(mobileDrawerSource, /Produtos/)
  assert.match(mobileDrawerSource, /to=\{[^\n]*store/)
  assert.match(mobileDrawerSource, /to="\/nossa-loja"/)
  assert.match(mobileDrawerSource, /to="\/ajuda"/)
  assert.doesNotMatch(mobileDrawerSource, /HeaderActions/)
  assert.doesNotMatch(stickyHeaderSource, /HeaderMobileDrawer/)
  assert.match(stickyHeaderSource, /hidden .*lg:block/)
})

test("desktop products menu has a usable trigger and canonical store route", () => {
  assert.match(productsMenuSource, /onClick=\{\(\) => setIsOpen\(/)
  assert.match(productsMenuSource, /aria-expanded=\{isOpen\}/)
  assert.match(productsMenuSource, /event\.key === "Escape"/)
  assert.match(productsMenuSource, /to="\/\$countryCode\/store"/)
  assert.match(productsMenuSource, /params=\{\{ countryCode \}\}/)
})

test("WhatsApp links use the canonical configured number", () => {
  for (const source of [accessibilityTopBarSource, helpPageSource]) {
    assert.match(source, /storeConfig\.whatsappNumber/)
    assert.doesNotMatch(source, /wa\.me\/55\$\{storeConfig\.phone/)
  }

  assert.match(productsMenuSource, /Ver todos/)
  assert.doesNotMatch(productsMenuSource, /Falar com especialista/)

  // Product actions delegate URL construction to the shared helper instead of
  // duplicating the configured WhatsApp number in the page component.
  assert.match(productPageSource, /ProductActions/)
  assert.match(productActionsSource, /createProductWhatsAppUrl/)
  assert.match(productActionsSource, /const whatsappUrl = createProductWhatsAppUrl/)
  assert.doesNotMatch(productActionsSource, /wa\.me\/55\$\{storeConfig\.phone/)
})

test("floating accessibility control opens and closes the persistent panel", () => {
  assert.match(accessibilityButtonSource, /onClick=\{togglePanel\}/)
  assert.match(accessibilityButtonSource, /aria-expanded=\{preferences\.panelEnabled\}/)
  assert.match(accessibilityButtonSource, /aria-controls="a11y-panel-drawer"/)
  assert.match(accessibilityProviderSource, /const setPanelOpen = useCallback/)
  assert.match(accessibilityProviderSource, /setPanelOpen,/)
  assert.match(accessibilityProviderSource, /localStorage\.setItem\(STORAGE_KEY/)
  assert.match(accessibilityPanelSource, /onOpenChange=\{setPanelOpen\}/)
  assert.doesNotMatch(accessibilityPanelSource, /onOpenChange=\{togglePanel\}/)
})

test("newsletter uses the persistent endpoint and is rendered only by Home", () => {
  assert.match(newsletterSource, /subscribeToNewsletter/)
  assert.match(newsletterSource, /confirmation_pending/)
  assert.match(newsletterSource, /validation_error/)
  assert.match(newsletterSource, /consent/)
  assert.match(newsletterSource, /Política de Privacidade/)
  assert.match(newsletterSource, /Quero receber novidades/)
  assert.doesNotMatch(publicLayoutSource, /NewsletterSignup/)
  assert.match(publicHomeSource, /import \{ NewsletterSignup \}/)
  assert.match(publicHomeSource, /<NewsletterSignup \/>/)
})

test("listing product cards navigate to the PDP without a cart CTA", () => {
  assert.match(productCardSource, /data-testid="product-card-link"/)
  assert.match(productCardSource, /<FavoriteButton/)
  assert.match(productCardSource, /const sku = .*\|\| null/)
  assert.match(productCardSource, /\{sku && \(/)
  assert.doesNotMatch(productCardSource, /Adicionar ao carrinho/)
  assert.doesNotMatch(productCardSource, /useAddToCart/)
  assert.doesNotMatch(productCardSource, /Mais vendido/)
})

test("mobile header remains sticky without restoring the accessibility top bar", () => {
  assert.match(fullHeaderSource, /sticky top-0/)
  assert.match(fullHeaderSource, /lg:relative/)
  assert.doesNotMatch(fullHeaderSource, /<AccessibilityTopBar/)
})
