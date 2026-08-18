import { createPortal } from "react-dom"
import { Link, useParams } from "@tanstack/react-router"
import { Menu, X } from "lucide-react"
import { type TransitionEvent, useEffect, useRef, useState } from "react"
import { productCategories } from "@/components/header/categories"
import { HeaderSearch } from "@/components/header/HeaderSearch"
import { HeaderLogo } from "@/components/header/HeaderLogo"
import { HeaderPostalCode } from "@/components/header/HeaderPostalCode"

export function HeaderMobileDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [mountedCategory, setMountedCategory] = useState<string | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousOverflowRef = useRef("")
  const categoryFrameRef = useRef<number | null>(null)
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  useEffect(() => {
    setIsHydrated(true)
  }, [])

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

  const closeDrawer = () => {
    if (!isOpen) {
      setIsMounted(false)
    }
    setIsOpen(false)
    setExpandedCategory(null)
  }

  const openDrawer = () => {
    setIsMounted(true)
    setIsOpen(true)
  }

  const handleDrawerTransitionEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (
      !isOpen &&
      event.target === event.currentTarget &&
      (event.propertyName === "transform" || event.propertyName === "opacity")
    ) {
      setIsMounted(false)
    }
  }

  const toggleCategory = (id: string) => {
    if (expandedCategory === id) {
      setExpandedCategory(null)
      return
    }

    if (categoryFrameRef.current !== null) {
      window.cancelAnimationFrame(categoryFrameRef.current)
    }

    setMountedCategory(id)
    categoryFrameRef.current = window.requestAnimationFrame(() => {
      setExpandedCategory(id)
      categoryFrameRef.current = null
    })
  }

  const toCountryPath = (href: string) =>
    href.replace(/^\/br(?=\/|$)/, `/${countryCode}`)

  const drawer = isMounted ? (
    <div
      className={`fixed inset-0 z-[80] lg:hidden ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}
      data-state={isOpen ? "open" : "closed"}
      data-testid="mobile-navigation-layer"
    >
      <button
        type="button"
        className={`absolute inset-0 bg-black/50 transition-opacity data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:duration-[var(--motion-duration-medium)] data-[state=closed]:duration-[var(--motion-duration-small)] data-[state=open]:ease-[var(--motion-ease-enter)] data-[state=closed]:ease-[var(--motion-ease-exit)] ${isOpen ? "opacity-100" : "opacity-0"}`}
        onClick={closeDrawer}
        aria-label="Fechar menu mobile"
        data-state={isOpen ? "open" : "closed"}
        data-testid="mobile-navigation-overlay"
      />

      <div
        ref={drawerRef}
        id="mobile-navigation-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className={`motion-mobile-drawer absolute inset-y-0 left-0 flex w-[min(85vw,24rem)] min-w-0 flex-col overflow-hidden bg-white shadow-2xl transition-[transform,opacity] data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full data-[state=open]:opacity-100 data-[state=closed]:opacity-0 data-[state=open]:duration-[var(--motion-duration-menu-open)] data-[state=closed]:duration-[var(--motion-duration-menu-close)] data-[state=open]:ease-[var(--motion-ease-enter)] data-[state=closed]:ease-[var(--motion-ease-exit)] ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}
        data-state={isOpen ? "open" : "closed"}
        data-testid="mobile-navigation-drawer"
        onTransitionEnd={handleDrawerTransitionEnd}
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
            <div className="mt-3">
              <HeaderPostalCode mobile />
            </div>
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
                  const hasChildren = Boolean(category.children?.length)

                  return (
                    <li key={category.id}>
                      {hasChildren ? (
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
                      ) : (
                        <Link
                          to={toCountryPath(category.href) as string}
                          onClick={closeDrawer}
                          className="block min-h-11 rounded-md px-4 py-3 text-sm font-medium text-[var(--color-navy)] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                        >
                          {category.label}
                        </Link>
                      )}

                      {hasChildren && mountedCategory === category.id && category.children && (
                        <ul
                          id={categoryPanelId}
                          aria-hidden={!isExpanded}
                          className={`motion-accordion-content mt-1 mb-2 overflow-hidden rounded-md bg-[var(--color-surface)] py-2 transition-[max-height,opacity,transform] duration-[var(--motion-duration-accordion)] ease-[var(--motion-ease-move)] ${isExpanded ? "max-h-[32rem] translate-y-0 opacity-100" : "pointer-events-none max-h-0 -translate-y-1 opacity-0"}`}
                          onTransitionEnd={(event) => {
                            if (!isExpanded && event.propertyName === "max-height") {
                              setMountedCategory(null)
                            }
                          }}
                        >
                          {category.children.map((child) => (
                            <li key={child.id}>
                              <Link
                                to={toCountryPath(child.href) as string}
                                onClick={closeDrawer}
                                tabIndex={isExpanded ? 0 : -1}
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
        onClick={openDrawer}
        aria-label="Abrir menu mobile"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation-drawer"
        data-testid="mobile-navigation-trigger"
        data-hydrated={isHydrated ? "true" : "false"}
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      {typeof document !== "undefined" && drawer ? createPortal(drawer, document.body) : null}
    </>
  )
}
