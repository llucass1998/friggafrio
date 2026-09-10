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
  assert.match(mobileDrawerSource, /aria-expanded=\{isMobileMenuOpen\}/)
  assert.match(mobileDrawerSource, /aria-controls="mobile-navigation-drawer"/)
  assert.match(mobileDrawerSource, /role="dialog"/)
  assert.match(mobileDrawerSource, /event\.key === "Escape"/)
  assert.match(mobileDrawerSource, /data-testid="mobile-navigation-overlay"/)
  assert.match(mobileDrawerSource, /data-testid="mobile-navigation-close"/)
  assert.match(mobileDrawerSource, /document\.body\.style\.overflow = "hidden"/)
  assert.match(mobileDrawerSource, /document\.body\.style\.overflow = previousOverflowRef\.current/)
  assert.match(mobileDrawerSource, /createPortal\(drawer, document\.body\)/)
  assert.match(mobileDrawerSource, /aria-hidden=\{!isMobileMenuOpen\}/)
  assert.match(mobileDrawerSource, /mobile-drawer-panel/)
  assert.match(mobileDrawerSource, /const openMobileMenu = \(\) => setIsMobileMenuOpen\(true\)/)
  assert.match(mobileDrawerSource, /const closeMobileMenu = \(\) => \{[\s\S]*setIsMobileMenuOpen\(false\)/)
  assert.doesNotMatch(mobileDrawerSource, /setTimeout\(/)
  assert.doesNotMatch(mobileDrawerSource, /openTimerRef/)
  assert.match(mobileDrawerSource, /data-hydrated=\{isHydrated \? "true" : "false"\}/)
})

test("mobile navigation has canonical links and no duplicate action group", () => {
  assert.match(mobileDrawerSource, /Categorias/)
  assert.match(mobileDrawerSource, /Ver todos os produtos/)
  assert.match(mobileDrawerSource, /border-\[var\(--color-primary\)\]\/20 bg-\[var\(--color-surface-soft\)\]/)
  assert.match(mobileDrawerSource, /to=\{[^\n]*store/)
  assert.match(mobileDrawerSource, /to="\/nossa-loja"/)
  assert.match(mobileDrawerSource, /to="\/ajuda"/)
  assert.doesNotMatch(mobileDrawerSource, /HeaderActions/)
  assert.doesNotMatch(stickyHeaderSource, /HeaderMobileDrawer/)
  assert.match(stickyHeaderSource, /hidden .*lg:block/)
})

test("mobile categories are grouped, collapsible, and keep navigation accessible", () => {
  assert.match(mobileDrawerSource, /productCategories\.map/)
  assert.match(mobileDrawerSource, /aria-expanded=\{isExpanded\}/)
  assert.match(mobileDrawerSource, /aria-controls=\{categoryPanelId\}/)
  assert.match(mobileDrawerSource, /min-h-12 w-full/)
  assert.match(mobileDrawerSource, /px-5 py-3/)
  assert.match(mobileDrawerSource, /border-b border-\[var\(--color-border\)\]/)
  assert.match(mobileDrawerSource, /Falar com especialista/)
  assert.match(mobileDrawerSource, /storeConfig\.whatsappNumber/)
  assert.match(mobileDrawerSource, /mobile-drawer-content/)
  assert.match(mobileDrawerSource, /overflow-hidden transition-\[max-height,opacity\]/)
  assert.match(mobileDrawerSource, /tabIndex=\{isExpanded \? 0 : -1\}/)
  assert.match(mobileDrawerSource, /<Package className="h-3\.5 w-3\.5"/)
  assert.match(mobileDrawerSource, /<ChevronRight className="h-4 w-4 shrink-0 text-\[var\(--color-text-muted\)\]"/)
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
  assert.match(accessibilityButtonSource, /focus-visible:ring-4/)
  assert.match(accessibilityButtonSource, /aria-label="Abrir opções de acessibilidade"/)
  assert.match(accessibilityButtonSource, /<Accessibility[^>]+aria-hidden="true"/)
  assert.match(accessibilityProviderSource, /const setPanelOpen = useCallback/)
  assert.match(accessibilityProviderSource, /setPanelOpen,/)
  assert.match(accessibilityProviderSource, /localStorage\.setItem\(STORAGE_KEY/)
  assert.match(accessibilityPanelSource, /onOpenChange=\{setPanelOpen\}/)
  assert.doesNotMatch(accessibilityPanelSource, /onOpenChange=\{togglePanel\}/)
  // Radix wires aria-describedby to the rendered Dialog.Description id.
  assert.match(accessibilityPanelSource, /<Dialog\.Description[^>]*>/)
  assert.doesNotMatch(accessibilityPanelSource, /aria-describedby="a11y-panel-description"/)
  assert.match(accessibilityPanelSource, /max-h-\[100dvh\]/)
  assert.match(accessibilityPanelSource, /safe-area-inset-bottom/)
  assert.match(accessibilityPanelSource, /onCloseAutoFocus/)
  assert.match(accessibilityPanelSource, /a11y-floating-button/)
  assert.match(accessibilityPanelSource, /mobile-navigation-trigger/)
  assert.match(accessibilityPanelSource, /getClientRects\(\)\.length/)
  assert.doesNotMatch(accessibilityPanelSource, /key as any/)
})

test("newsletter preserves the approved consent-first light-card design", () => {
  assert.match(newsletterSource, /subscribeToNewsletter/)
  assert.match(newsletterSource, /consent_version/)
  assert.match(newsletterSource, /Fique por dentro da FriggaFrio/)
  assert.match(newsletterSource, /Política de Privacidade/)
  assert.match(newsletterSource, /bg-\[#f3f9fd\]/)
  assert.match(newsletterSource, /aria-live="polite"/)
  assert.doesNotMatch(newsletterSource, /Quer ficar mais perto da FriggaFrio/)
  assert.doesNotMatch(newsletterSource, /\\\\u00(?:e3|e7|f5|ea)/)
  assert.match(newsletterSource, /validation_error/)
  assert.doesNotMatch(publicLayoutSource, /NewsletterSignup/)
  assert.match(publicHomeSource, /import \{ NewsletterSignup \}/)
  assert.match(publicHomeSource, /<NewsletterSignup \/>/)
})

test("listing product cards retain PDP navigation without a cart CTA", () => {
  assert.match(productCardSource, /data-testid="product-card-link"/)
  assert.match(productCardSource, /<FavoriteButton/)
  assert.match(productCardSource, /const sku = .*\|\| null/)
  assert.match(productCardSource, /\{sku && \(/)
  assert.doesNotMatch(productCardSource, /Adicionar ao carrinho/)
  assert.doesNotMatch(productCardSource, /useAddToCart/)
  assert.doesNotMatch(productCardSource, /Mais vendido/)
})

test("mobile header remains fixed without restoring the accessibility top bar", () => {
  assert.match(fullHeaderSource, /mobile-site-header/)
  assert.match(publicLayoutSource, /mobile-header-spacer/)
  assert.doesNotMatch(fullHeaderSource, /<AccessibilityTopBar/)
})
