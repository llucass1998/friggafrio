import { Link } from "@tanstack/react-router"
import { ArrowRight, Award, Leaf, ShieldCheck } from "lucide-react"

export function HomeInstitutionalStory() {
  return (
    <section
      aria-labelledby="institutional-story-title"
      className="bg-white py-14 sm:py-18 lg:py-22 border-b border-[var(--color-border)]"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-soft)] px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-primary)]">
            Quem Somos
          </span>

          <h2
            id="institutional-story-title"
            className="mt-4 text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[var(--color-navy)] leading-tight"
          >
            Nossa história, experiência que gera confiança
          </h2>

          <p className="mt-3 text-base sm:text-lg font-medium text-[var(--color-primary)] leading-relaxed">
            Tradição, excelência técnica e compromisso com o futuro da refrigeração.
          </p>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-[var(--color-text-muted)] text-left sm:text-center">
            A FriggaFrio nasceu da experiência e da dedicação de profissionais que conhecem profundamente o setor de refrigeração e climatização. Inspirada pela trajetória de Paulo Neulaender, com mais de 45 anos de atuação no mercado, a empresa reúne conhecimento técnico, atendimento especializado e responsabilidade ambiental para oferecer soluções confiáveis aos seus clientes.
          </p>

          {/* Pilares discretos */}
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 text-left">
            <div className="flex items-start gap-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 sm:p-5">
              <Award className="h-6 w-6 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-[var(--color-navy)]">45+ anos de mercado</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Bagagem técnica de consultoria e capacitação no Brasil e no exterior.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 sm:p-5">
              <Leaf className="h-6 w-6 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-[var(--color-navy)]">Pioneirismo ambiental</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Compromisso com o recolhimento, recuperação e reciclagem de fluidos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 sm:p-5">
              <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--color-primary)]" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-bold text-[var(--color-navy)]">Orientação especializada</h3>
                <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  Suporte técnico contínuo para mecânicos, técnicos e instaladores.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 flex justify-center">
            <Link
              to="/quem-somos"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-navy)] active:scale-98 shadow-sm"
            >
              Conheça nossa história
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
