import { companyTeam } from "@/config/company-team"
import { TeamMemberCard } from "@/components/quem-somos/TeamMemberCard"
import { CarouselSectionHeader, useInfiniteCarousel } from "@/components/carousel/InfiniteCarousel"
import { ShieldCheck, Award, Leaf, Users } from "lucide-react"

export function QuemSomosPage() {
  const founders = companyTeam.filter((m) => m.group === "founder" && m.active)
  const leadership = companyTeam.filter((m) => m.group === "leadership" && m.active)
  const team = companyTeam.filter((m) => m.group === "team" && m.active)

  // Embla needs enough content to cover two viewports for a seamless loop.
  // The leadership list is intentionally short, so reuse the same real people
  // as decorative loop items without creating additional employee records.
  const leadershipSlides = Array.from(
    { length: leadership.length ? Math.max(leadership.length * 2, 8) : 0 },
    (_, index) => ({
      member: leadership[index % leadership.length],
      clone: index >= leadership.length,
    })
  )

  const {
    viewportRef: leadershipViewportRef,
    hasOverflow: leadershipHasOverflow,
    scrollPrev: leadershipScrollPrev,
    scrollNext: leadershipScrollNext,
  } = useInfiniteCarousel()

  const {
    viewportRef: teamViewportRef,
    hasOverflow: teamHasOverflow,
    scrollPrev: teamScrollPrev,
    scrollNext: teamScrollNext,
  } = useInfiniteCarousel()

  return (
    <div className="w-full min-h-screen bg-[#FAFAFA] font-sans pb-24 text-[var(--color-text)]">
      {/* Hero Institucional */}
      <section className="bg-[var(--color-navy)] text-white py-16 sm:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#13385E]">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-block px-3.5 py-1 mb-4 text-xs font-semibold tracking-wider uppercase rounded-full bg-white/10 text-blue-100">
            Quem Somos
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight text-white leading-tight">
            Nossa história, experiência que gera confiança
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed font-medium">
            FriggaFrio — Tradição, excelência técnica e compromisso com o futuro da refrigeração
          </p>
        </div>
      </section>

      {/* Destaques / Pilares Institucionais */}
      <section className="py-8 bg-white border-b border-[#E5EDF4]" aria-label="Valores FriggaFrio">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-4">
              <Award className="h-8 w-8 text-[var(--color-primary)] mb-2" aria-hidden="true" />
              <span className="text-2xl font-extrabold text-[var(--color-navy)]">45+ Anos</span>
              <span className="text-xs text-[var(--color-text-muted)] mt-1">de atuação no mercado</span>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <Leaf className="h-8 w-8 text-[var(--color-primary)] mb-2" aria-hidden="true" />
              <span className="text-2xl font-extrabold text-[var(--color-navy)]">Pioneirismo</span>
              <span className="text-xs text-[var(--color-text-muted)] mt-1">em reciclagem e regeneração</span>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <ShieldCheck className="h-8 w-8 text-[var(--color-primary)] mb-2" aria-hidden="true" />
              <span className="text-2xl font-extrabold text-[var(--color-navy)]">Excelência</span>
              <span className="text-xs text-[var(--color-text-muted)] mt-1">suporte técnico contínuo</span>
            </div>
            <div className="flex flex-col items-center text-center p-4">
              <Users className="h-8 w-8 text-[var(--color-primary)] mb-2" aria-hidden="true" />
              <span className="text-2xl font-extrabold text-[var(--color-navy)]">Parceria</span>
              <span className="text-xs text-[var(--color-text-muted)] mt-1">ao lado dos profissionais</span>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo Institucional Oficial */}
      <article className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Bloco 1: História e Paulinho */}
        <section aria-labelledby="historia-heading" className="mb-14 sm:mb-16">
          <h2 id="historia-heading" className="text-2xl sm:text-3xl font-extrabold text-[var(--color-navy)] mb-6 tracking-tight">
            Nossa História
          </h2>
          <div className="space-y-5 text-base sm:text-lg leading-relaxed text-gray-700">
            <p>
              A história da <strong className="font-semibold text-[var(--color-navy)]">FriggaFrio</strong> nasce da experiência, da paixão pelo setor e da visão de um profissional que dedicou sua vida ao desenvolvimento da refrigeração no Brasil: <strong className="font-semibold text-[var(--color-navy)]">Paulo Neulaender, carinhosamente conhecido como Paulinho</strong>.
            </p>
            <p>
              Com mais de 45 anos de atuação no mercado, Paulinho construiu uma trajetória marcada pelo conhecimento técnico, pelo compromisso ambiental e pela contribuição ao desenvolvimento do setor de refrigeração e climatização. Ao longo dessa jornada, realizou palestras e treinamentos em todo o território brasileiro e atuou por 15 anos como consultor nacional e internacional das Nações Unidas, participando de projetos voltados à eliminação de CFCs e HCFCs no Brasil, na África, no Peru e em outros locais.
            </p>
            <p>
              Sua atuação também se estendeu a importantes instituições e entidades do setor. Por mais de 30 anos, integrou a diretoria da ABRAVA, atuou como conselheiro do SENAI, criou o portal Ambiente Gelado e o Grupo Ozônio, além de exercer, por mais de cinco anos, a presidência da Câmara Ambiental de Refrigeração e Ar-Condicionado da CETESB.
            </p>
            <p>
              Ao longo de sua carreira, prestou consultoria a grandes redes comerciais, indústrias e instituições nacionais e internacionais, como Eletros, UNIDO e GIZ, contribuindo para a disseminação de conhecimento, o aprimoramento de práticas técnicas e a evolução das soluções ambientais aplicadas ao setor.
            </p>
          </div>
        </section>

        {/* Bloco 2: Pioneirismo e responsabilidade ambiental */}
        <section aria-labelledby="pioneirismo-heading" className="mb-14 sm:mb-16 rounded-2xl bg-white p-6 sm:p-8 md:p-10 border border-[#E5EDF4] shadow-sm">
          <h2 id="pioneirismo-heading" className="text-xl sm:text-2xl font-bold text-[var(--color-navy)] mb-4 tracking-tight flex items-center gap-3">
            <Leaf className="h-6 w-6 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
            Pioneirismo e responsabilidade ambiental
          </h2>
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-gray-700">
            <p>
              Entre suas contribuições mais relevantes está o pioneirismo na implantação de práticas de recolhimento, recuperação e reciclagem de fluidos refrigerantes no Brasil. Em 2006, participou diretamente do suporte técnico às centrais de regeneração de fluidos refrigerantes desenvolvidas no país, colaborando para o avanço de soluções mais responsáveis e sustentáveis para o mercado.
            </p>
            <p className="font-medium text-[var(--color-navy)] bg-[#F0F7FD] p-4 rounded-xl border-l-4 border-[var(--color-primary)]">
              Essa experiência consolidou uma visão que permanece presente na essência da FriggaFrio: <strong className="font-semibold text-[var(--color-navy)]">a excelência técnica deve caminhar lado a lado com a responsabilidade ambiental e o compromisso com as próximas gerações.</strong>
            </p>
          </div>
        </section>

        {/* Bloco 3: Conhecimento que se transforma em soluções */}
        <section aria-labelledby="conhecimento-heading" className="mb-14 sm:mb-16">
          <h2 id="conhecimento-heading" className="text-xl sm:text-2xl font-bold text-[var(--color-navy)] mb-4 tracking-tight">
            Conhecimento que se transforma em soluções
          </h2>
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-gray-700">
            <p>
              A força da FriggaFrio também está nas pessoas que constroem sua história. Nossa equipe de diretores e colaboradores reúne décadas de experiência no setor, com atuação expressiva na refrigeração comercial e profundo conhecimento das necessidades técnicas e operacionais do mercado.
            </p>
            <p>
              Entendemos que, por trás de cada sistema de refrigeração, existem desafios reais que exigem conhecimento, agilidade, segurança e soluções confiáveis. Conhecemos a rotina de mecânicos, técnicos, engenheiros, instaladores e profissionais que enfrentam diariamente situações complexas em campo.
            </p>
            <p>
              Por isso, nosso trabalho vai além do fornecimento de produtos. Oferecemos orientação especializada, consultoria técnica contínua e suporte dedicado, buscando compreender cada necessidade e contribuir efetivamente para a resolução de problemas.
            </p>
            <p>
              Acreditamos que uma parceria de valor se constrói com diálogo, transparência, disponibilidade e conhecimento aplicado à realidade de cada cliente.
            </p>
          </div>
        </section>

        {/* Bloco 4: Um legado que continua evoluindo */}
        <section aria-labelledby="legado-heading" className="mb-12 rounded-2xl bg-[var(--color-navy)] text-white p-6 sm:p-8 md:p-10 shadow-md">
          <h2 id="legado-heading" className="text-xl sm:text-2xl font-bold text-white mb-4 tracking-tight">
            Um legado que continua evoluindo
          </h2>
          <div className="space-y-4 text-base sm:text-lg leading-relaxed text-blue-100">
            <p>
              Hoje, a FriggaFrio fortalece sua presença no mercado de refrigeração comercial e industrial, mantendo vivos os princípios que deram origem à sua história: atendimento próximo e acolhedor, profundo conhecimento técnico, responsabilidade ambiental e compromisso com resultados.
            </p>
            <p>
              Mais do que a experiência acumulada ao longo de décadas, carregamos um legado de dedicação ao setor e respeito aos profissionais que fazem a refrigeração acontecer todos os dias.
            </p>
            <p className="pt-2 font-bold text-white text-lg">
              FriggaFrio. Experiência que inspira confiança. Conhecimento que transforma desafios em soluções. Compromisso com a evolução da refrigeração.
            </p>
          </div>
        </section>
      </article>

      {/* Fundador & Diretoria (Preservados conforme arquitetura do projeto) */}
      {(founders.length > 0 || leadership.length > 0) && (
        <section className="border-t border-[#E5EDF4] bg-white py-12 md:py-16" aria-label="Diretoria FriggaFrio">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            {founders.length > 0 && (
              <div className="mx-auto mb-12 flex w-full max-w-4xl flex-col items-center gap-8 md:flex-row md:items-start">
                {founders.map((founder) => (
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
              <>
                <CarouselSectionHeader
                  title="Diretoria"
                  description="Conheça as pessoas que conduzem a FriggaFrio"
                  hasOverflow={leadershipHasOverflow}
                  onPrevious={leadershipScrollPrev}
                  onNext={leadershipScrollNext}
                  previousLabel="Diretor anterior"
                  nextLabel="Próximo diretor"
                />
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
              </>
            )}
          </div>
        </section>
      )}

      {/* Nossa Equipe (Preservada conforme arquitetura do projeto) */}
      {team.length > 0 && (
        <section className="py-10 md:py-12 border-t border-[#E5EDF4]" aria-label="Quem faz a Frigga">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <CarouselSectionHeader
              title="Quem faz a Frigga"
              description="Conheça as pessoas que fazem parte da FriggaFrio"
              hasOverflow={teamHasOverflow}
              onPrevious={teamScrollPrev}
              onNext={teamScrollNext}
              previousLabel="Colaborador anterior"
              nextLabel="Próximo colaborador"
            />
            <div ref={teamViewportRef} className="ff-carousel-viewport mt-8" data-carousel-viewport="true" role="region" aria-label="Equipe FriggaFrio">
              <div className="ff-carousel-track" data-carousel-track="true">
                {team.map((member) => (
                  <div
                    key={member.id}
                    className="ff-carousel-slide ff-team-slide flex min-w-0"
                    data-carousel-slide="true"
                    data-carousel-original="true"
                  >
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
