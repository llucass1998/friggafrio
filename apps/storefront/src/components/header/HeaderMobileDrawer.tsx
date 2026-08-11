import { createPortal } from "react-dom"
import { Link, useParams } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { productCategories } from "@/components/header/categories"
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderLogo } from "@/components/header/HeaderLogo"

export function HeaderMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousOverflowRef = useRef("")
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  useEffect(() => {
    if (!isOpen) {
      return
    }

    previousOverflowRef.current = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
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
      document.body.style.overflow = previousOverflowRef.current
      trigger?.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const desktopMediaQuery = window.matchMedia("(min-width: 1024px)")
    const closeOnDesktop = () => {
      if (desktopMediaQuery.matches) {
        setIsOpen(false)
      }
    }

    desktopMediaQuery.addEventListener("change", closeOnDesktop)
    return () => desktopMediaQuery.removeEventListener("change", closeOnDesktop)
  }, [])

  const closeDrawer = () => {
    setIsOpen(false)
    setExpandedCategory(null)
  }

  const toggleCategory = (id: string) => {
    setExpandedCategory((current) => (current === id ? null : id))
  }

  const toCountryPath = (href: string) =>
    href.replace(/^\/br(?=\/|$)/, `/${countryCode}`)

  const drawer = isOpen ? (
    <div className="fixed inset-0 z-[80] lg:hidden" data-testid="mobile-navigation-layer">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        onClick={closeDrawer}
        aria-label="Fechar menu mobile"
        data-testid="mobile-navigation-overlay"
      />

      <div
        ref={drawerRef}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className="absolute inset-y-0 left-0 flex w-[min(85vw,24rem)] min-w-0 flex-col overflow-hidden bg-white shadow-2xl"
        data-testid="mobile-navigation-drawer"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-white p-4">
          <div onClick={closeDrawer}>
            <HeaderLogo compact />
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={closeDrawer}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            aria-label="Fechar menu"
            data-testid="mobile-navigation-close"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="border-b border-[var(--color-border)] p-4">
            <HeaderSearch compact />
          </div>

          <nav className="p-2" aria-label="Navegação mobile">
            <div className="mb-2">
              <Link
                to={"/$countryCode/store" as string}
                params={{ countryCode }}
                onClick={closeDrawer}
                className="block rounded-md px-4 py-3 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                Produtos
              </Link>

              <ul className="space-y-1">
                {productCategories.map((category) => {
                  const categoryPanelId = `mobile-category-${category.id}`
                  const isExpanded = expandedCategory === category.id

                  return (
                    <li key={category.id}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(category.id)}
                        aria-expanded={isExpanded}
                        aria-controls={categoryPanelId}
                        className="flex min-h-11 w-full items-center justify-between rounded-md px-4 py-3 text-left text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                      >
                        {category.label}
                        <span className="text-xl leading-none" aria-hidden="true">
                          {isExpanded ? "-" : "+"}
                        </span>
                      </button>

                      {isExpanded && category.children && (
                        <ul id={categoryPanelId} className="mt-1 mb-2 overflow-hidden rounded-md bg-[var(--color-surface)] py-2">
                          {category.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                to={toCountryPath(child.href) as string}
                                onClick={closeDrawer}
                                className="block min-h-11 px-8 py-3 text-sm text-[var(--color-text)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                              >
                                {child.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>

            <div>
              <h3 className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Institucional
              </h3>
              <ul className="space-y-1">
                <li>
                  <Link
                    to="/nossa-loja"
                    onClick={closeDrawer}
                    className="block min-h-11 rounded-md px-4 py-3 text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Nossa Loja
                  </Link>
                </li>
                <li>
                  <Link
                    to="/ajuda"
                    onClick={closeDrawer}
                    className="block min-h-11 rounded-md px-4 py-3 text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                  >
                    Central de Ajuda
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="-ml-2 flex min-h-11 min-w-11 items-center justify-center rounded-md p-2 text-[var(--color-navy)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] lg:hidden"
        onClick={() => setIsOpen(true)}
        aria-label="Abrir menu mobile"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        data-testid="mobile-navigation-trigger"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {typeof document !== "undefined" && drawer ? createPortal(drawer, document.body) : null}
    </>
  )
}
