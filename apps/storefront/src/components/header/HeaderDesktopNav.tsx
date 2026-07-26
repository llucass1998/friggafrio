import { Link } from "@tanstack/react-router"
import { ProductsMegaMenu } from "./ProductsMegaMenu"
import { mainNavigation, applicationCategories } from "./categories"
import { ChevronDown } from "lucide-react"

export function HeaderDesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-6 h-full">
      {/* 1. Mega Menu (Produtos) */}
      <ProductsMegaMenu />

      {/* 2. Menu Simples (Aplicações) */}
      <div className="group relative h-full">
        <button className="flex items-center gap-1 text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors h-full py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2">
          Aplicações
          <ChevronDown className="w-4 h-4 transition-transform group-hover:-rotate-180" />
        </button>

        <div className="absolute top-full left-0 w-64 bg-white shadow-xl rounded-b-md border border-[var(--color-border)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-2">
          {applicationCategories.map((app) => (
            <Link
              key={app.id}
              to={app.href as any}
              className="block px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] transition-colors"
            >
              {app.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Links Diretos */}
      <Link
        to="/nossa-loja"
        className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
      >
        Nossa Loja
      </Link>

      {mainNavigation.filter(nav => nav.id !== "nav-gases" && nav.id !== "nav-compressores" && nav.id !== "nav-camara" && nav.id !== "nav-ferramentas").map((nav) => (
        <Link
          key={nav.id}
          to={nav.href as any}
          className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
        >
          {nav.label}
        </Link>
      ))}
    </nav>
  )
}
