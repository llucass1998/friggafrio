
import { CreditCard, Headset, ShieldCheck, Store } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { useCallback, useEffect, useState } from "react"

const benefits = [
  {
    id: "installments",
    title: "Até 10x sem juros",
    description: "Parcele suas compras no cartão de crédito",
    icon: CreditCard,
  },
  {
    id: "pickup",
    title: "Retirada na loja",
    description: "Compre online e retire em nossa loja física",
    icon: Store,
  },
  {
    id: "technical-support",
    title: "Atendimento técnico",
    description: "Especialistas em refrigeração e climatização",
    icon: Headset,
  },
  {
    id: "secure-purchase",
    title: "Compra segura",
    description: "CNPJ, endereço e políticas transparentes",
    icon: ShieldCheck,
  },
] as const

export function HomeCommercialBenefits() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
    breakpoints: {
      "(min-width: 768px)": { active: false },
    },
  })
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
      emblaApi.off("reInit", onSelect)
    }
  }, [emblaApi, onSelect])

  const scrollTo = useCallback((index: number) => {
    emblaApi?.scrollTo(index)
  }, [emblaApi])

  return (
    <section
      data-testid="home-commercial-benefits"
      aria-labelledby="home-commercial-benefits-title"
      className="bg-[var(--color-background)] pt-2 pb-5 sm:py-7"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 id="home-commercial-benefits-title" className="sr-only">Benefícios de comprar na FriggaFrio</h2>
        
        {/* Carousel container on mobile, standard grid on md and above */}
        <div ref={emblaRef} className="overflow-hidden md:overflow-visible">
          <div
            className="flex touch-pan-y md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-3 lg:gap-4"
            role="region"
            aria-label="Benefícios comerciais"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") emblaApi?.scrollPrev()
              if (e.key === "ArrowRight") emblaApi?.scrollNext()
            }}
          >
            {benefits.map(({ id, title, description, icon: Icon }) => (
              <div
                key={id}
                className="min-w-0 flex-[0_0_100%] md:flex-auto"
                role="group"
                aria-roledescription="slide"
                aria-label={title}
              >
                <article
                  className="group flex flex-col justify-center min-h-[128px] rounded-[var(--radius-card-lg)] border border-[var(--color-border)] bg-white p-5 shadow-[0_3px_12px_rgba(15,45,75,0.06)] transition-transform duration-200 hover:-translate-y-0.5 sm:min-h-[148px]"
                >
                  <Icon className="h-6 w-6 text-[var(--color-primary)] transition-transform duration-200 group-hover:scale-105" aria-hidden="true" />
                  <h3 className="mt-3 text-base font-bold leading-tight text-[var(--color-navy)]">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
                </article>
              </div>
            ))}
          </div>
        </div>

        {/* Indicadores no mobile */}
        {benefits.length > 1 && (
          <div className="mt-2.5 flex items-center justify-center gap-2 md:hidden" aria-label="Navegação dos benefícios">
            {benefits.map(({ id, title }, index) => {
              const active = selectedIndex === index
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollTo(index)}
                  className={`h-2.5 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] ${
                    active ? "w-8 bg-[var(--color-primary)]" : "w-2.5 bg-[var(--color-border)] hover:bg-[var(--color-primary)]"
                  }`}
                  aria-label={`Ir para benefício ${index + 1} de ${benefits.length}: ${title}`}
                  aria-current={active ? "true" : "false"}
                />
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
