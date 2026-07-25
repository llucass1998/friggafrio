import { Truck, ShieldCheck, ThermometerSnowflake, Leaf } from "lucide-react"

export function BenefitsSection() {
  const benefits = [
    {
      icon: <ThermometerSnowflake className="w-6 h-6 text-[var(--color-primary)]" />,
      title: "Variedade",
      description: "Produtos, acessórios e soluções para diferentes sistemas de refrigeração."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-[var(--color-primary)]" />,
      title: "Agilidade",
      description: "Atendimento comercial e técnico para ajudar na escolha correta."
    },
    {
      icon: <Truck className="w-6 h-6 text-[var(--color-primary)]" />,
      title: "Entrega responsável",
      description: "Opções de entrega e retirada conforme disponibilidade e região."
    },
    {
      icon: <Leaf className="w-6 h-6 text-[var(--color-primary)]" />,
      title: "Compromisso ambiental",
      description: "Orientação para recuperação e destinação responsável de fluidos e cilindros."
    }
  ]

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex flex-col gap-3 p-6 rounded-[var(--radius-card)] bg-[var(--color-surface-soft)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                {benefit.icon}
              </div>
              <h3 className="font-bold text-lg text-[var(--color-navy)]">{benefit.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
