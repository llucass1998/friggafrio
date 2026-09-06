import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8")

const themeSource = read("../../src/styles/theme.css")
const appStylesSource = read("../../src/styles/app.css")
const mobileDrawerSource = read("../../src/components/header/HeaderMobileDrawer.tsx")
const productsMenuSource = read("../../src/components/header/ProductsMegaMenu.tsx")
const cartSource = read("../../src/components/cart.tsx")
const drawerSource = read("../../src/components/ui/drawer.tsx")
const dialogSource = read("../../src/components/ui/dialog.tsx")
const publicLayoutSource = read("../../src/components/public-layout.tsx")

test("motion tokens use the canonical FriggaFrio timings and curves", () => {
  assert.match(themeSource, /--motion-duration-fast:\s*100ms/)
  assert.match(themeSource, /--motion-duration-interaction:\s*120ms/)
  assert.match(themeSource, /--motion-duration-small:\s*160ms/)
  assert.match(themeSource, /--motion-duration-base:\s*180ms/)
  assert.match(themeSource, /--motion-duration-medium:\s*220ms/)
  assert.match(themeSource, /--motion-duration-large:\s*260ms/)
  assert.match(themeSource, /--motion-duration-page:\s*280ms/)
  assert.match(themeSource, /--motion-duration-menu-open:\s*150ms/)
  assert.match(themeSource, /--motion-ease-enter:\s*cubic-bezier\(0, 0, 0\.4, 1\)/)
  assert.match(themeSource, /--motion-ease-exit:\s*cubic-bezier\(0\.5, 0, 1, 1\)/)
  assert.match(themeSource, /--motion-ease-move:\s*cubic-bezier\(0\.45, 0, 0\.4, 1\)/)
  assert.doesNotMatch(themeSource, /bounce-soft/)
})

test("reduced motion disables non-essential movement", () => {
  assert.match(appStylesSource, /prefers-reduced-motion:\s*reduce/)
  assert.match(appStylesSource, /animation-duration:\s*0\.01ms !important/)
  assert.match(appStylesSource, /transition-duration:\s*0\.01ms !important/)
})

test("page, menu, cart, and modal transitions use explicit motion primitives", () => {
  assert.match(publicLayoutSource, /key=\{pageKey\}/)
  assert.match(publicLayoutSource, /motion-page-enter/)
  assert.match(mobileDrawerSource, /requestAnimationFrame/)
  assert.match(mobileDrawerSource, /const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\)/)
  assert.match(appStylesSource, /\.mobile-drawer-panel[\s\S]*transform: translateX\(-100%\)/)
  assert.match(appStylesSource, /\.mobile-drawer-panel[\s\S]*display: flex[\s\S]*flex-direction: column[\s\S]*overflow-y: hidden/)
  assert.match(appStylesSource, /\.mobile-drawer-content[\s\S]*overflow-y: auto[\s\S]*touch-action: pan-y/)
  assert.match(appStylesSource, /transition: transform 150ms ease-in-out 150ms/)
  assert.doesNotMatch(mobileDrawerSource, /setTimeout\(/)
  assert.doesNotMatch(mobileDrawerSource, /openTimerRef/)
  assert.match(productsMenuSource, /transition-\[opacity,transform,visibility\]/)
  assert.match(productsMenuSource, /motion-duration-dropdown-open/)
  assert.match(cartSource, /motion-cart-item-removing/)
  assert.match(drawerSource, /motion-duration-cart-open/)
  assert.match(drawerSource, /motion-duration-cart-close/)
  assert.match(dialogSource, /motion-duration-modal-open/)
  assert.match(dialogSource, /motion-duration-modal-close/)
})

test("critical motion surfaces do not introduce transition-all", () => {
  for (const source of [productsMenuSource, cartSource, drawerSource, dialogSource]) {
    assert.doesNotMatch(source, /transition-all/)
    assert.doesNotMatch(source, /setTimeout\(/)
  }
  assert.doesNotMatch(mobileDrawerSource, /transition-all/)
})
