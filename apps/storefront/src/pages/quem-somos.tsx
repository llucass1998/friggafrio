import { companyTeam } from "@/config/company-team"
import { TeamMemberCard } from "@/components/quem-somos/TeamMemberCard"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"

export function QuemSomosPage() {
  const founders = companyTeam.filter(m => m.group === "founder" && m.active)
  const leadership = companyTeam.filter(m => m.group === "leadership" && m.active)
  const team = companyTeam.filter(m => m.group === "team" && m.active)
  // Embla needs enough content to cover two viewports for a seamless loop.
  // The leadership list is intentionally short, so reuse the same real people
  // as decorative loop items without creating additional employee records.
  const leadershipSlides = Array.from(
    { length: leadership.length ? Math.max(leadership.length * 2, 8) : 0 },
    (_, index) => ({
      member: leadership[index % leadership.length],
      clone: index >= leadership.length,
    }),
  )
  const {
    viewportRef: leadershipViewportRef,
    hasOverflow: leadershipHasOverflow,
    scrollPrev: leadershipScrollPrev,
    scrollNext: leadershipScrollNext,
  } = useInfiniteCarousel()
  const { viewportRef: teamViewportRef, hasOverflow: teamHasOverflow, scrollPrev: teamScrollPrev, scrollNext: teamScrollNext } = useInfiniteCarousel()

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] font-sans pb-24">
      {/* Hero Section */}
      <section className="bg-[var(--color-navy)] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">Quem Somos</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            A FriggaFrio reúne experiência técnica, atendimento próximo e soluções para refrigeração e climatização.
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-navy)] mb-8 text-center">Nossa História</h2>
          <div className="prose prose-lg mx-auto text-gray-700">
            <p>
              A Frigga nasceu da experiência de Paulo Neulaender, conhecido carinhosamente no setor como Paulinho. Com mais de 35 anos dedicados à instalação e manutenção de sistemas de ventilação, aquecimento, refrigeração e ar-condicionado (HVAC-R), a empresa foi erguida sobre uma fundação técnica extremamente sólida.
            </p>
            <p>
              Nossa trajetória é marcada pelo profundo conhecimento em fluidos refrigerantes e pela prestação de consultoria técnica contínua. Nós entendemos os desafios reais enfrentados pelos mecânicos, técnicos e engenheiros no campo, o que nos permite oferecer não apenas produtos, mas parcerias duradouras focadas na resolução de problemas.
            </p>
            <p>
              Hoje, a FriggaFrio se consolida como uma referência confiável, mantendo o compromisso original de unir atendimento acolhedor com altíssima excelência técnica para o mercado de refrigeração comercial e industrial.
            </p>
          </div>
        </div>
      </section>

      {/* Fundador & Diretoria */}
      {(founders.length > 0 || leadership.length > 0) && (
        <section className="border-y border-[#E5EDF4] bg-white py-12 md:py-16">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {leadership.length > 0 ? (
              <CarouselSectionHeader
                title="Diretoria"
                description="Conheça as pessoas que conduzem a FriggaFrio"
                hasOverflow={leadershipHasOverflow}
                onPrevious={leadershipScrollPrev}
                onNext={leadershipScrollNext}
                previousLabel="Diretor anterior"
                nextLabel="Próximo diretor"
              />
            ) : (
              <h2 className="mb-8 text-center text-3xl font-bold text-[var(--color-navy)] md:text-4xl">Diretoria</h2>
            )}
            
            {founders.length > 0 && (
              <div className="mx-auto mb-12 flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row md:items-start">
                {founders.map(founder => (
                  <div key={founder.id} className="w-full max-w-sm md:w-1/3 shrink-0">
                    <TeamMemberCard member={founder} />
                  </div>
                ))}
                <div className="w-full md:w-2/3 flex flex-col justify-center">
                  <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-4">Experiência e Visão</h3>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Nossa diretoria atua ativamente no desenvolvimento do mercado, garantindo que os valores da FriggaFrio se mantenham íntegros desde as negociações com fornecedores até o atendimento no balcão de nossas lojas.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Com forte presença e atuação próxima aos clientes, nossos líderes inspiram a equipe a buscar excelência contínua, trazendo inovações e as melhores práticas para o setor de HVAC-R.
                  </p>
                </div>
              </div>
            )}

            {leadership.length > 0 && (
              <div ref={leadershipViewportRef} className="ff-carousel-viewport mt-8" data-carousel-viewport="true" role="region" aria-label="Diretoria FriggaFrio">
                <div className="ff-carousel-track" data-carousel-track="true">
                  {leadershipSlides.map(({ member: leader, clone }, index) => (
                    <div
                      key={`${leader.id}-${index}`}
                      className="ff-carousel-slide ff-team-slide flex min-w-0"
                      data-carousel-slide="true"
                      data-carousel-original={clone ? "false" : "true"}
                      aria-hidden={clone ? "true" : undefined}
                    >
                      <TeamMemberCard member={leader} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Nossa Equipe */}
      {team.length > 0 && (
        <section className="py-10 md:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <CarouselSectionHeader
              title="Quem faz a Frigga"
              description="Conheça as pessoas que fazem parte da FriggaFrio"
              hasOverflow={teamHasOverflow}
              onPrevious={teamScrollPrev}
              onNext={teamScrollNext}
              previousLabel="Membro anterior"
              nextLabel="Próximo membro"
            />
            <div ref={teamViewportRef} className="ff-carousel-viewport" data-carousel-viewport="true" role="region" aria-label="Equipe FriggaFrio">
              <div className="ff-carousel-track" data-carousel-track="true">
                {team.map(member => (
                  <div key={member.id} className="ff-carousel-slide ff-team-slide flex min-w-0" data-carousel-slide="true">
                    <TeamMemberCard member={member} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
