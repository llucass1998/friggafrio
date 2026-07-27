import { Link, useParams } from "@tanstack/react-router"
import { storeConfig } from "@/config/store"
import { COMPANY_INFORMATION } from "@/config/company"
import { footerNavigation } from "@/config/footer-navigation"
import { useAuth } from "@/lib/hooks/use-auth"
import { useState } from "react"

function Accordion({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-gray-700/50 md:border-none py-2 md:py-0">
      <button
        type="button"
        className="flex md:hidden w-full items-center justify-between py-3 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-sm font-bold text-white uppercase tracking-wider">{title}</span>
        <svg className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <h3 className="hidden md:block text-sm font-bold text-white uppercase tracking-wider mb-4">
        {title}
      </h3>
      <div className={`overflow-hidden transition-all duration-300 md:block md:max-h-none md:opacity-100 md:mb-0 ${isOpen ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0"}`}>
        {children}
      </div>
    </div>
  )
}

export function PublicFooter() {
  const params = useParams({ strict: false }) as Record<string, string>
  const countryCode = params.countryCode || "br"
  const currentYear = new Date().getFullYear()
  const { customer } = useAuth()

  const getAccountHref = (baseHref: string) => {
    if (baseHref.startsWith("/account") && !customer && baseHref !== "/account/login" && baseHref !== "/account/register") {
      return `/${countryCode}/account/login?returnTo=${encodeURIComponent(`/${countryCode}${baseHref}`)}`
    }
    
    return baseHref.startsWith("/account") 
      ? `/${countryCode}${baseHref}`
      : baseHref.startsWith("/") ? `/${countryCode}${baseHref}` : baseHref
  }

  const primaryLocation = storeConfig.locations[0]

  return (
    <footer className="bg-[var(--color-navy)] text-white pt-8 relative w-full shrink-0 border-t-[8px] border-[#bae6fd]">

      {/* 1. Área Superior de Benefícios e Atendimento */}
      <div className="border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center lg:text-left">
            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="bg-[var(--color-primary)]/20 p-3 rounded-full text-[var(--color-accent)]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm uppercase">Televendas</h4>
                <a href={`tel:${storeConfig.phone.replace(/\D/g, "")}`} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">{storeConfig.phone}</a>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="bg-[#25D366]/20 p-3 rounded-full text-[#25D366]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm uppercase">Atendimento Rápido</h4>
                <a href={`https://wa.me/${storeConfig.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#25D366] hover:text-[#20bd5a] transition-colors">Via WhatsApp</a>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="bg-[var(--color-primary)]/20 p-3 rounded-full text-[var(--color-accent)]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm uppercase">Nossa Loja Física</h4>
                <Link to="/nossa-loja" className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">Venha nos visitar</Link>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="bg-[var(--color-primary)]/20 p-3 rounded-full text-[var(--color-accent)]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h4 className="font-bold text-white text-sm uppercase">Compra 100% Segura</h4>
                <span className="text-sm text-[var(--color-surface-soft)]">Ambiente blindado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Área Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand & Sobre */}
          <div className="lg:col-span-1 mb-6 md:mb-0">
            <Link to={"/$countryCode" as string} params={{ countryCode }} className="inline-block mb-4">
              <img src="/images/brand/logo-friggafrio.png" alt="FriggaFrio Logo" className="h-12 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-sm text-[var(--color-surface-soft)] leading-relaxed mb-6">
              {storeConfig.description || "Especialistas em refrigeração, ar-condicionado e câmaras frias. Produtos e componentes de alta performance."}
            </p>
            <div className="flex flex-col gap-2">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Redes Sociais</span>
              <div className="flex gap-4 mt-2">
                <a href={storeConfig.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-[var(--color-surface-soft)] hover:text-white transition-colors bg-gray-800 p-2 rounded-full">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.88z"/></svg>
                </a>
              </div>
            </div>
          </div>

                    <div className="md:col-span-4 lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {/* Produtos */}
            <Accordion title="Produtos" defaultOpen={true}>
              <ul className="space-y-3">
                {footerNavigation.products.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    <Link to={item.href as string} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Accordion>

            {/* Institucional */}
            <Accordion title="Institucional">
              <ul className="space-y-3">
                {footerNavigation.institutional.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    {item.id === "fale-conosco" ? (
                      <a href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent("Olá! Estou no site da FriggaFrio e gostaria de falar com a equipe.")}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors" aria-label="Falar com a FriggaFrio pelo WhatsApp">
                        {item.label}
                      </a>
                    ) : (
                      <Link to={item.href as string} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </Accordion>

            {/* Atendimento */}
            <Accordion title="Atendimento">
              <ul className="space-y-3">
                {footerNavigation.support.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    <Link to={item.href as string} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
                {footerNavigation.support.filter(item => item.active).length === 0 && (
                   <li className="text-sm text-gray-500 italic">Área em construção</li>
                )}
              </ul>
            </Accordion>

            {/* Minha Conta */}
            <Accordion title="Minha Conta">
              <ul className="space-y-3">
                {footerNavigation.account.filter(item => item.active).map(item => (
                  <li key={item.id}>
                    <Link to={getAccountHref(item.href) as string} className="text-sm text-[var(--color-surface-soft)] hover:text-white transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </Accordion>
          </div>
        </div>
      </div>

      {/* 3. Área Inferior com Pagamento, Segurança */}
      <div className="bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 md:gap-4">

            <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Formas de Pagamento</span>
              <div className="flex gap-2 flex-wrap justify-center">
                <div className="bg-white px-2 py-1 rounded text-gray-800 text-xs font-bold w-12 h-8 flex items-center justify-center shadow-sm">VISA</div>
                <div className="bg-white px-2 py-1 rounded text-gray-800 text-xs font-bold w-12 h-8 flex items-center justify-center shadow-sm">MC</div>
                <div className="bg-white px-2 py-1 rounded text-gray-800 text-xs font-bold w-12 h-8 flex items-center justify-center shadow-sm">AMEX</div>
                <div className="bg-white px-2 py-1 rounded text-[#00bdae] text-xs font-bold w-12 h-8 flex items-center justify-center shadow-sm">PIX</div>
                <div className="bg-white px-2 py-1 rounded text-gray-800 text-xs font-bold w-12 h-8 flex items-center justify-center shadow-sm">BOLETO</div>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Segurança</span>
              <div className="flex gap-4 justify-center">
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span className="text-xs">SSL<br/>Blindado</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs">Compra<br/>Segura</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom bar - Dados da Empresa e Links Legais */}
      <div className="bg-black border-t border-gray-800 text-center md:text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">

            <div className="text-xs text-gray-500 space-y-1">
              <p>&copy; {currentYear} {storeConfig.name}. Todos os direitos reservados.</p>
              <p>
                {COMPANY_INFORMATION.legalName} - CNPJ: {COMPANY_INFORMATION.cnpj}
                <span className="hidden md:inline"> | </span>
                <span className="block md:inline mt-1 md:mt-0">
                  {primaryLocation?.addressLine} - {primaryLocation?.district} - {primaryLocation?.city} - {primaryLocation?.stateCode} - CEP: {primaryLocation?.postalCode}
                </span>
              </p>
              <p className="text-[10px] mt-2 text-gray-600 max-w-3xl">
                Preços e condições de pagamento exclusivos para compras via internet, podendo variar nas lojas físicas. Ofertas válidas até o término dos nossos estoques para internet.
              </p>
            </div>

            

          </div>
        </div>
      </div>
    </footer>
  )
}
