import { Link } from "@tanstack/react-router"
import { ProductsMegaMenu } from "@/components/header/ProductsMegaMenu"
import { mainNavigation } from "@/components/header/categories"

export function HeaderDesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-6 h-full">
      {/* 1. Mega Menu (Produtos) */}
      <ProductsMegaMenu />

      {/* 2. Links Diretos */}
      {mainNavigation.filter(nav => nav.id !== "nav-gases" && nav.id !== "nav-compressores" && nav.id !== "nav-camara" && nav.id !== "nav-ferramentas").map((nav) => (
        <Link
          key={nav.id}
          to={nav.href as string}
          className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
        >
          {nav.label}
        </Link>
      ))}
    </nav>
  )
}
