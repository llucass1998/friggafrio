import { Link } from "@tanstack/react-router"
import { storeConfig } from "../../config/store"

export function HeroSection() {
  return (
    <section className="relative bg-[var(--color-surface)] overflow-hidden border-b border-[var(--color-border)]">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-surface)] via-[var(--color-surface)] to-[var(--color-surface-soft)] opacity-90 z-0"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--color-border)] rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="py-16 md:py-24 lg:py-32 flex flex-col md:flex-row items-center gap-12">
          
          {/* Content Column */}
          <div className="w-full md:w-1/2 flex flex-col items-start gap-6 text-left">
            <div className="inline-flex items-center rounded-full border border-[var(--color-accent)] bg-[var(--color-surface-soft)] px-3 py-1 text-sm font-semibold text-[var(--color-primary)]">
              Especialistas em Refrigeração
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[var(--color-navy)] leading-[1.1] tracking-tight">
              Refrigeração profissional começa com a <span className="text-[var(--color-primary)]">escolha certa.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl leading-relaxed">
              Encontre gases refrigerantes, compressores, componentes, ferramentas e soluções técnicas para instalações residenciais, comerciais e industriais.
            </p>
            
            <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4 pt-4">
              <Link 
                to="/" 
                className="inline-flex justify-center items-center px-6 py-3.5 rounded-[var(--radius-button)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
              >
                Ver produtos
              </Link>
              <Link 
                to="/" 
                className="inline-flex justify-center items-center px-6 py-3.5 rounded-[var(--radius-button)] bg-white border border-[var(--color-border)] hover:bg-[var(--color-surface-soft)] text-[var(--color-navy)] font-medium text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)]"
              >
                Solicitar orçamento
              </Link>
            </div>
          </div>

          {/* Visual Column */}
          <div className="w-full md:w-1/2 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-[var(--radius-card-lg)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] overflow-hidden shadow-sm flex items-center justify-center">
              {/* Fallback image when real images are not available */}
              <div className="text-center p-6">
                <svg xmlns="http://www.w3.org/w3.org/2000/svg" className="w-16 h-16 mx-auto mb-4 text-[var(--color-primary)] opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
                <span className="block text-sm font-medium text-[var(--color-text-muted)]">Equipamentos Friggafrio</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  )
}
