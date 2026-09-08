import { createPortal } from "react-dom"
import { Link, useLocation, useParams } from "@tanstack/react-router"
import { Accessibility, ChevronRight, Menu, MessageCircle, Package, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { productCategories } from "@/components/header/categories"
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderLogo } from "@/components/header/HeaderLogo"
import { HeaderPostalCode } from "@/components/header/HeaderPostalCode"
import { useAccessibility } from "@/components/accessibility/accessibility-context"
import { storeConfig } from "@/config/store"

export function HeaderMobileDrawer() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousOverflowRef = useRef("")
  const previousHtmlOverflowRef = useRef("")
  const previousScrollYRef = useRef(0)
  const scrollLockActiveRef = useRef(false)
  const categoryFrameRef = useRef<number | null>(null)
  const { setPanelOpen } = useAccessibility()
  const location = useLocation()
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    const releaseScrollLock = () => {
      if (!scrollLockActiveRef.current) {
        return
      }

      document.body.style.overflow = previousOverflowRef.current
      document.documentElement.style.overflow = previousHtmlOverflowRef.current
      window.scrollTo(0, previousScrollYRef.current)
      scrollLockActiveRef.current = false
    }

    if (!isMobileMenuOpen) {
      releaseScrollLock()
      return
    }

    previousOverflowRef.current = document.body.style.overflow
    previousHtmlOverflowRef.current = document.documentElement.style.overflow
    previousScrollYRef.current = window.scrollY
    document.body.style.overflow = "hidden"
    document.documentElement.style.overflow = "hidden"
    scrollLockActiveRef.current = true

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false)
        return
      }

      if (event.key === "Tab") {
        const focusableElements = drawerRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )

        if (!focusableElements?.length) {
          return
        }

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    const focusFrame = window.requestAnimationFrame(() => closeRef.current?.focus())
    const trigger = triggerRef.current

    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener("keydown", handleKeyDown)
      releaseScrollLock()
      trigger?.focus()
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    setIsMobileMenuOpen(false)
    setExpandedCategory(null)
  }, [location.pathname])

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = () => {
      if (desktopMediaQuery.matches) {
        setIsMobileMenuOpen(false)
        setExpandedCategory(null)
      }
    }

    desktopMediaQuery.addEventListener("change", closeOnDesktop)
    return () => {
      desktopMediaQuery.removeEventListener("change", closeOnDesktop)
      if (categoryFrameRef.current !== null) {
        window.cancelAnimationFrame(categoryFrameRef.current)
      }
    }
  }, [])

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    setExpandedCategory(null)
  }

  const openMobileMenu = () => setIsMobileMenuOpen(true)

  const toggleCategory = (id: string) => {
    if (expandedCategory === id) {
      setExpandedCategory(null)
      return
    }

    if (categoryFrameRef.current !== null) {
      window.cancelAnimationFrame(categoryFrameRef.current)
    }

    categoryFrameRef.current = window.requestAnimationFrame(() => {
      setExpandedCategory(id)
      categoryFrameRef.current = null
    })
  }

  const toCountryPath = (href: string) =>
    href.replace(/^\/br(?=\/|$)/, `/${countryCode}`)

  const drawer = (
    <div
      className={`fixed inset-0 z-[80] lg:hidden ${isMobileMenuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      data-state={isMobileMenuOpen ? "open" : "closed"}
      data-testid="mobile-navigation-layer"
    >
      <button
        type="button"
        className="mobile-drawer-overlay"
        onClick={closeMobileMenu}
        aria-label="Fechar menu mobile"
        tabIndex={isMobileMenuOpen ? 0 : -1}
        data-state={isMobileMenuOpen ? "open" : "closed"}
        data-testid="mobile-navigation-overlay"
      />

      <div
        ref={drawerRef}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal={isMobileMenuOpen ? "true" : undefined}
        aria-label="Menu principal"
        aria-hidden={!isMobileMenuOpen}
        className="mobile-drawer-panel"
        data-state={isMobileMenuOpen ? "open" : "closed"}
        data-testid="mobile-navigation-drawer"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white p-4">
          <div onClick={closeMobileMenu}>
            <HeaderLogo compact />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeMobileMenu}
            className="mobile-drawer-close flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
            aria-label="Fechar menu"
            data-testid="mobile-navigation-close"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="border-b border-[var(--color-border)] p-4">
          <HeaderSearch compact />
          <div className="mt-3">
            <HeaderPostalCode mobile />
          </div>
        </div>

        <div className="mobile-drawer-content">
          <nav className="p-2" aria-label="Navegação mobile">
            <div className="mb-2">
              <Link
                to={"/$countryCode/store" as string}
                params={{ countryCode }}
                onClick={closeMobileMenu}
                className="block min-h-12 rounded-md px-5 py-3 text-sm font-semibold text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                Ver todos os produtos
              </Link>

              <h2 className="px-5 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Categorias</h2>
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
                {productCategories.map((category) => {
                  const categoryPanelId = `mobile-category-${category.id}`
                  const isExpanded = expandedCategory === category.id
                  const children = category.children ?? []

                  return (
                    <section key={category.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        aria-expanded={isExpanded}
                        aria-controls={categoryPanelId}
                        className={`flex min-h-12 w-full items-center gap-3 px-5 py-3 text-left text-sm font-semibold text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] active:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${isExpanded ? "bg-[var(--color-surface-soft)]" : ""}`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-soft)] text-[var(--color-primary)]" aria-hidden="true">
                          <Package className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">{category.label}</span>
                        <span className="text-xs font-medium text-[var(--color-text-muted)]">{children.length}</span>
                        <ChevronRight className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`} aria-hidden="true" />
                      </button>
                      <div id={categoryPanelId} aria-hidden={!isExpanded} className={`overflow-hidden transition-[max-height,opacity] duration-[var(--motion-duration-accordion)] ease-[var(--motion-ease-move)] ${isExpanded ? "max-h-[32rem] opacity-100" : "max-h-0 opacity-0"}`}>
                        <ul className="border-t border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1">
                          {children.map((child) => (
                            <li key={child.id}>
                              <Link
                                to={toCountryPath(child.href) as string}
                                onClick={closeMobileMenu}
                                tabIndex={isExpanded ? 0 : -1}
                                className="flex min-h-12 items-center gap-3 rounded-md border-b border-[var(--color-border)] px-3 py-3 text-sm text-[var(--color-navy)] transition-colors last:border-b-0 hover:bg-[var(--color-surface-soft)] active:bg-[var(--color-surface-soft)] focus-visible:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                              >
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" aria-hidden="true" />
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </section>
                  )
                })}
              </div>
            </div>

            <div>
              <h3 className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Institucional
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/nossa-loja"
                    onClick={closeMobileMenu}
                    className="block min-h-11 rounded-md px-4 py-3 text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Nossa Loja
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ajuda"
                    onClick={closeMobileMenu}
                    className="block min-h-11 rounded-md px-4 py-3 text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Central de Ajuda
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu()
                      setPanelOpen(true)
                    }}
                    className="flex min-h-11 w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    <Accessibility className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
                    Acessibilidade
                  </button>
                </li>
              </ul>
            </div>

            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent("Olá! Gostaria de falar com um especialista da FriggaFrio.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Falar com especialista
            </a>
          </nav>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--color-navy)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] lg:hidden"
        onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
        aria-label={isMobileMenuOpen ? "Fechar menu mobile" : "Abrir menu mobile"}
        aria-expanded={isMobileMenuOpen}
        aria-controls="mobile-navigation-drawer"
        data-testid="mobile-navigation-trigger"
        data-hydrated={isHydrated ? "true" : "false"}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {isHydrated && typeof document !== "undefined" ? createPortal(drawer, document.body) : null}
    </>
  )
}
