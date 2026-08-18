import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Link, useParams } from "@tanstack/react-router"
import { ChevronDown, ChevronRight } from "lucide-react"
import { storeConfig } from "@/config/store"
import { useCategories } from "@/lib/hooks/use-categories"

export function ProductsMegaMenu() {
  const [activeParent, setActiveParent] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = `products-mega-menu-${useId().replace(/:/g, "")}`
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const { data: categories = [], isLoading } = useCategories({ queryParams: { limit: 100, offset: 0 } })

  const topLevel = useMemo(() => categories.filter((category) => !category.parent_category_id), [categories])
  const childrenByParent = useMemo(() => {
    const grouped = new Map<string, typeof categories>()
    for (const category of categories) {
      if (!category.parent_category_id) continue
      const children = grouped.get(category.parent_category_id) || []
      children.push(category)
      grouped.set(category.parent_category_id, children)
    }
    return grouped
  }, [categories])
  const parentCategories = useMemo(
    () => topLevel.filter((category) => (childrenByParent.get(category.id) || []).length > 0),
    [childrenByParent, topLevel]
  )
  const activeParentData = topLevel.find((category) => category.id === activeParent)
  const activeChildren = activeParentData ? childrenByParent.get(activeParentData.id) || [] : []

  useEffect(() => {
    if (!isOpen) return
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)
  const renderCategoryLink = (category: (typeof topLevel)[number]) => (
    <Link
      key={category.id}
      to="/$countryCode/categories/$handle"
      params={{ countryCode, handle: category.handle }}
      onClick={closeMenu}
      className="flex min-h-10 items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
    >
      <span className="line-clamp-2">{category.name}</span>
      <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
    </Link>
  )

  return (
    <div
      ref={menuRef}
      className="group relative z-50"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="-ml-2 flex h-full items-center gap-1 rounded-md px-2 py-4 font-medium text-[var(--color-navy)] transition-colors hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        Produtos
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "-rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <div
        id={menuId}
        role="region"
        aria-label="Categorias de produtos"
        className={`absolute left-0 top-full w-[min(92vw,900px)] origin-top overflow-hidden rounded-b-lg border border-[var(--color-border)] bg-white shadow-xl transition-[opacity,transform,visibility] duration-[var(--motion-duration-dropdown-open)] ease-[var(--motion-ease-enter)] ${isOpen ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"}`}
      >
        <div className="max-h-[min(70vh,460px)] overflow-y-auto p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-text-muted)]">Catálogo</p>
              <h3 className="mt-1 text-lg font-bold text-[var(--color-navy)]">
                {activeParentData?.name || "Encontre por categoria"}
              </h3>
            </div>
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              onClick={closeMenu}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              Ver todos
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenu}
              className="hidden items-center gap-1 text-xs font-semibold text-[#16803c] hover:underline sm:inline-flex"
            >
              Falar com especialista
            </a>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" aria-live="polite" aria-busy="true">
              {Array.from({ length: 8 }, (_, index) => <div key={index} className="h-10 animate-pulse rounded-md bg-[var(--color-surface-soft)]" />)}
            </div>
          ) : topLevel.length === 0 ? (
            <p className="py-6 text-sm text-[var(--color-text-muted)]">Nenhuma categoria disponível.</p>
          ) : parentCategories.length === 0 ? (
            <nav aria-label="Categorias de produtos" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
              {topLevel.map(renderCategoryLink)}
            </nav>
          ) : (
            <div className="grid gap-5 md:grid-cols-[minmax(180px,0.75fr)_minmax(0,1.5fr)]">
              <nav aria-label="Departamentos" className="grid content-start gap-1 sm:grid-cols-2 md:grid-cols-1">
                {topLevel.map((category) => {
                  const hasChildren = (childrenByParent.get(category.id) || []).length > 0
                  if (!hasChildren) return renderCategoryLink(category)
                  const categoryPanelId = `${menuId}-${category.id}-children`
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onMouseEnter={() => setActiveParent(category.id)}
                      onFocus={() => setActiveParent(category.id)}
                      onClick={() => setActiveParent(category.id)}
                      aria-expanded={activeParent === category.id}
                      aria-controls={categoryPanelId}
                      className={`flex min-h-10 items-center justify-between rounded-md px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${activeParent === category.id ? "bg-[var(--color-surface-soft)] text-[var(--color-primary)]" : "text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]"}`}
                    >
                      {category.name}
                      <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )
                })}
              </nav>

              <div className="min-w-0">
                {activeParentData && activeChildren.length > 0 ? (
                  <div id={`${menuId}-${activeParentData.id}-children`}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h4 className="text-sm font-semibold text-[var(--color-navy)]">{activeParentData.name}</h4>
                      <Link
                        to="/$countryCode/categories/$handle"
                        params={{ countryCode, handle: activeParentData.handle }}
                        onClick={closeMenu}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                      >
                        Ver departamento
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-x-5 gap-y-1 sm:grid-cols-3">
                      {activeChildren.map((child) => (
                        <Link
                          key={child.id}
                          to="/$countryCode/categories/$handle"
                          params={{ countryCode, handle: child.handle }}
                          onClick={closeMenu}
                          className="rounded-md px-2 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md bg-[var(--color-surface-soft)] p-4">
                    <p className="text-sm text-[var(--color-text-muted)]">Selecione um departamento para ver as subcategorias.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
