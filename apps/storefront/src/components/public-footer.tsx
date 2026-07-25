import { Link, useParams } from "@tanstack/react-router"
import { storeConfig } from "../config/store"

export function PublicFooter() {
  const params = useParams({ strict: false }) as { countryCode?: string }
  const countryCode = params.countryCode || "br"

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-navy)] text-white">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-8">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to={"/$countryCode" as string} params={{ countryCode }} className="flex items-center gap-2 mb-4 focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">
              <span className="font-bold text-2xl tracking-tight text-white">{storeConfig.name}</span>
            </Link>
            <p className="text-sm text-[var(--color-surface-soft)] leading-relaxed mb-6">
              {storeConfig.description}
            </p>

            <a
              href={storeConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm"
            >
              <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              @frigga.frio
            </a>
          </div>

          {/* Produtos */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Produtos
            </h3>
            <ul className="space-y-3">
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Gases Refrigerantes</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Compressores</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Câmara Fria</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Ferramentas</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Componentes</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-accent)] font-medium hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Ver todos</Link></li>
            </ul>
          </div>

          {/* Atendimento */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Atendimento
            </h3>
            <ul className="space-y-3">
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Solicitar orçamento</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Falar com especialista</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Contato</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Entregas e retirada</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Perguntas frequentes</Link></li>
            </ul>
          </div>

          {/* Institucional */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Institucional
            </h3>
            <ul className="space-y-3">
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Sobre a Friggafrio</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Serviços</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Meio ambiente</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Central técnica</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Política de privacidade</Link></li>
              <li><Link to={"/$countryCode" as string} params={{ countryCode }} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm">Termos de uso</Link></li>
            </ul>
          </div>

          {/* Contato (Address) */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Contato
            </h3>
            <div className="space-y-4">
              <address className="not-italic text-sm text-[var(--color-surface-soft)] leading-relaxed">
                {storeConfig.address.street}<br />
                {storeConfig.address.district}<br />
                {storeConfig.address.city} - {storeConfig.address.state}<br />
                CEP {storeConfig.address.postalCode}
              </address>

              <div className="flex flex-col gap-1">
                <a href={`tel:${storeConfig.phone.replace(/\D/g, '')}`} className="text-sm font-medium text-white hover:text-[var(--color-accent)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm w-fit">
                  {storeConfig.phone}
                </a>
                <a href={`mailto:${storeConfig.email}`} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm w-fit">
                  {storeConfig.email}
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--color-primary)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <p className="text-sm text-[var(--color-surface-soft)] opacity-80">
              &copy; {currentYear} {storeConfig.name}. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
