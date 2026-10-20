import { Link } from "@tanstack/react-router"
import { ProductsMegaMenu } from "@/components/header/ProductsMegaMenu"
import { mainNavigation } from "@/components/header/categories"
import { siteFeatures } from "@/config/site-features"

export function HeaderDesktopNav() {
  return (
    <nav className="hidden lg:flex items-center gap-6 h-full" aria-label="Navegação institucional">
      {/* 1. Quem Somos */}
      <Link
        to="/quem-somos"
        className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
      >
        Quem Somos
      </Link>

      {/* 2. Nossas Lojas */}
      <Link
        to="/nossa-loja"
        className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
      >
        Nossas lojas
      </Link>

      {/* Acesso contextual ao Catálogo de Produtos */}
      <Link
        to="/store"
        className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
      >
        Catálogo
      </Link>

      {/* Central de Ajuda / Contato */}
      {siteFeatures.showHelpCenter && (
        <Link
          to="/ajuda"
          className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
        >
          Central de Ajuda
        </Link>
      )}

      {/* Marketplace preservado.
          Oculto durante a fase institucional.
          Reativação: consultar siteFeatures e o guia de rollback.
      */}
      {siteFeatures.showHeaderProductNavigation && (
        <>
          <ProductsMegaMenu />
          {mainNavigation
            .filter(
              (nav) =>
                nav.id !== "nav-gases" &&
                nav.id !== "nav-compressores" &&
                nav.id !== "nav-camara" &&
                nav.id !== "nav-ferramentas"
            )
            .map((nav) => (
              <Link
                key={nav.id}
                to={nav.href as string}
                className="text-[var(--color-navy)] font-medium hover:text-[var(--color-primary)] transition-colors py-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-md px-2"
              >
                {nav.label}
              </Link>
            ))}
        </>
      )}
    </nav>
  )
}
