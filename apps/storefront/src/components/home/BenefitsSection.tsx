import { Truck, ShieldCheck, ThermometerSnowflake, Leaf } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: <ThermometerSnowflake className="w-6 h-6 text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-110" />,
      title: "Variedade",
      description: "Produtos, acessórios e soluções para diferentes sistemas de refrigeração."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-110" />,
      title: "Agilidade",
      description: "Atendimento comercial e técnico para ajudar na escolha correta."
    },
    {
      icon: <Truck className="w-6 h-6 text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-110" />,
      title: "Entrega responsável",
      description: "Opções de entrega e retirada conforme disponibilidade e região."
    },
    {
      icon: <Leaf className="w-6 h-6 text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-110" />,
      title: "Compromisso ambiental",
      description: "Orientação para recuperação e destinação responsável de fluidos e cilindros."
    }
  ]

  return (
    <section className="py-16 md:py-20 lg:py-24 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="group flex flex-col items-start gap-4 p-6 sm:p-8 rounded-[var(--radius-card-lg)] bg-[var(--color-surface-soft)] border border-transparent hover:border-[var(--color-border)] hover:bg-white hover:shadow-sm transition-all duration-200"
            >
              <div className="w-12 h-12 rounded-[var(--radius-button)] bg-white border border-[var(--color-border)] flex items-center justify-center shadow-sm group-hover:border-[var(--color-primary)] transition-colors duration-200">
                {benefit.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--color-navy)] mb-2 tracking-tight group-hover:text-[var(--color-primary)] transition-colors duration-200">{benefit.title}</h3>
                <p className="text-sm md:text-base text-[var(--color-text-muted)] leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
