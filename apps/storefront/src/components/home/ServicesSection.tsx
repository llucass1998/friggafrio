import { Link } from "@tanstack/react-router"
import { demoServices } from "../../data/demo/services"

export function ServicesSection() {
  return (
    <section className="py-16 bg-[var(--color-navy)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Serviços Especializados Friggafrio</h2>
          <p className="text-[var(--color-surface-soft)] opacity-90 text-sm md:text-base">
            Além de produtos, oferecemos soluções completas em gestão ambiental e eficiência técnica para o seu sistema de refrigeração.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoServices.map((service) => (
            <div 
              key={service.id}
              className="bg-white/5 border border-white/10 rounded-[var(--radius-card)] p-6 hover:bg-white/10 transition-colors flex flex-col"
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-primary)] flex items-center justify-center mb-5">
                <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {service.icon === 'recycle' && <><path d="M7 15.3l-3-3 3-3"/><path d="M4 12.3h10.5a5.5 5.5 0 0 1 0 11H12"/><path d="M17 8.7l3 3-3 3"/><path d="M20 11.7H9.5a5.5 5.5 0 0 1 0-11H12"/></>}
                  {service.icon === 'trash-2' && <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>}
                  {service.icon === 'refresh-cw' && <><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></>}
                  {/* Default fallback icon */}
                  {(!['recycle', 'trash-2', 'refresh-cw'].includes(service.icon)) && <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>}
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">{service.title}</h3>
              <p className="text-[var(--color-surface-soft)] opacity-80 text-sm leading-relaxed mb-6 flex-1">
                {service.description}
              </p>
              <Link 
                to="/" 
                className="inline-flex items-center text-sm font-semibold text-[var(--color-accent)] hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] rounded-sm w-fit"
              >
                Saiba mais
                <svg xmlns="http://www.w3.org/w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
