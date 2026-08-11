import { useEffect, useRef, useState } from "react"
import { Link, useParams } from "@tanstack/react-router"
import { ChevronDown, ChevronRight } from "lucide-react"
import { productCategories } from "@/components/header/categories"
import { storeConfig } from "@/config/store"

export function ProductsMegaMenu() {
  const [activeCategory, setActiveCategory] = useState<string>(productCategories[0].id)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"

  const activeCategoryData = productCategories.find((category) => category.id === activeCategory) || productCategories[0]
  const toCountryPath = (href: string) =>
    href.replace(/^\/br(?=\/|$)/, `/${countryCode}`)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [isOpen])

  const closeMenu = () => setIsOpen(false)

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
        aria-controls="products-mega-menu"
      >
        Produtos
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "-rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <div
        id="products-mega-menu"
        role="region"
        aria-label="Categorias de produtos"
        className={`absolute left-0 top-full flex w-[800px] origin-top overflow-hidden rounded-b-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl transition-all duration-200 xl:w-[1000px] ${
          isOpen
            ? "visible opacity-100"
            : "invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100"
        }`}
      >
        <div className="w-1/3 border-r border-[var(--color-border)] bg-[var(--color-surface)] py-4">
          <ul className="flex flex-col">
            {productCategories.map((category) => (
              <li key={category.id}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onFocus={() => setActiveCategory(category.id)}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex w-full items-center justify-between border-l-4 px-6 py-3 text-left transition-colors ${
                    activeCategory === category.id
                      ? "border-[var(--color-primary)] bg-white font-semibold text-[var(--color-primary)]"
                      : "border-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-soft)]"
                  }`}
                >
                  {category.label}
                  <ChevronRight className={`h-4 w-4 ${activeCategory === category.id ? "opacity-100" : "opacity-0"}`} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 px-6">
            <Link
              to="/$countryCode/store"
              params={{ countryCode }}
              onClick={closeMenu}
              className="flex items-center gap-1 text-sm font-medium text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              Ver todos os produtos
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="w-2/3 bg-white p-8">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--color-navy)]">{activeCategoryData.label}</h3>
            <Link
              to={toCountryPath(activeCategoryData.href) as string}
              onClick={closeMenu}
              className="mt-1 inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              Explorar departamento completo →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {activeCategoryData.children?.filter((child) => !child.id.endsWith("-all")).map((child) => (
              <Link
                key={child.id}
                to={toCountryPath(child.href) as string}
                onClick={closeMenu}
                className="min-h-11 py-1 text-sm font-medium text-[var(--color-text)] transition-all hover:translate-x-1 hover:text-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
              >
                {child.label}
              </Link>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-navy)]">Precisando de ajuda?</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Fale com nossos especialistas técnicos.</p>
            </div>
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded px-4 py-2 text-xs font-bold text-white transition-colors bg-[#25D366] hover:bg-[#20bd5a] focus-visible:outline-2 focus-visible:outline-[var(--color-accent)]"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
