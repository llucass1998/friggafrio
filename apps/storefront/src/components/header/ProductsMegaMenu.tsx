import { Link } from "@tanstack/react-router"
import { ChevronDown, ChevronRight } from "lucide-react"
import { NavigationItem, productCategories, applicationCategories, mainNavigation } from "./categories"
import { useState } from "react"

export function ProductsMegaMenu() {
  const [activeCategory, setActiveCategory] = useState<string>(productCategories[0].id)

  const activeCategoryData = productCategories.find(c => c.id === activeCategory) || productCategories[0]

  return (
    <div className="group relative">
      <button className="flex items-center gap-1 text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors h-full py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2 -ml-2">
        Produtos
        <ChevronDown className="w-4 h-4 transition-transform group-hover:-rotate-180" />
      </button>

      {/* Dropdown Container */}
      <div className="absolute top-full left-0 w-[800px] xl:w-[1000px] bg-[var(--color-background)] shadow-2xl rounded-b-lg border border-[var(--color-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex overflow-hidden">

        {/* Left Sidebar - Categories */}
        <div className="w-1/3 bg-[var(--color-surface)] border-r border-[var(--color-border)] py-4">
          <ul className="flex flex-col">
            {productCategories.map((category) => (
              <li key={category.id}>
                <button
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onFocus={() => setActiveCategory(category.id)}
                  className={`w-full text-left px-6 py-3 flex items-center justify-between transition-colors ${
                    activeCategory === category.id
                      ? "bg-white text-[var(--color-primary)] font-semibold border-l-4 border-[var(--color-primary)]"
                      : "text-[var(--color-text)] hover:bg-[var(--color-surface-soft)] border-l-4 border-transparent"
                  }`}
                >
                  {category.label}
                  <ChevronRight className={`w-4 h-4 ${activeCategory === category.id ? "opacity-100" : "opacity-0"}`} />
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-6 px-6">
            <Link
              to="/br/store"
              className="text-[var(--color-primary)] font-medium hover:underline flex items-center gap-1 text-sm"
            >
              Ver todos os produtos
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Right Content - Subcategories */}
        <div className="w-2/3 p-8 bg-white">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-[var(--color-navy)]">{activeCategoryData.label}</h3>
            <Link
              to={activeCategoryData.href as any}
              className="text-[var(--color-text-muted)] text-sm hover:text-[var(--color-primary)] hover:underline inline-block mt-1"
            >
              Explorar departamento completo &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            {activeCategoryData.children?.filter(child => !child.id.endsWith('-all')).map((child) => (
              <Link
                key={child.id}
                to={child.href as any}
                className="text-[var(--color-text)] hover:text-[var(--color-primary)] hover:translate-x-1 transition-all text-sm font-medium py-1"
              >
                {child.label}
              </Link>
            ))}
          </div>

          {/* Promo/Feature Block */}
          <div className="mt-8 p-4 bg-[var(--color-surface)] rounded-md border border-[var(--color-border)] flex items-center justify-between">
            <div>
              <p className="font-bold text-[var(--color-navy)] text-sm">Precisando de ajuda?</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Fale com nossos especialistas técnicos.</p>
            </div>
            <a
              href="https://wa.me/5511948777156"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-[#25D366] text-white px-4 py-2 rounded hover:bg-[#20bd5a] transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
