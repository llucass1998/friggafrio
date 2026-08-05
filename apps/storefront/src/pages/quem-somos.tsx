import { Link } from "@tanstack/react-router"
import { companyTeam } from "@/config/company-team"
import { TeamMemberCard } from "@/components/quem-somos/TeamMemberCard"
import { storeConfig } from "@/config/store"
import { PhoneCall } from "lucide-react"

export function QuemSomosPage() {
  const founders = companyTeam.filter(m => m.group === "founder" && m.active)
  const leadership = companyTeam.filter(m => m.group === "leadership" && m.active)
  const team = companyTeam.filter(m => m.group === "team" && m.active)

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
        <section className="bg-white py-16 md:py-24 px-4 border-y border-[#E5EDF4]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-navy)] mb-12 text-center">Diretoria</h2>
            
            {founders.length > 0 && (
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start max-w-4xl mx-auto mb-16">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-12 justify-center">
                {leadership.map(leader => (
                  <TeamMemberCard key={leader.id} member={leader} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Nossa Equipe */}
      {team.length > 0 && (
        <section className="py-16 md:py-24 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-navy)] mb-12 text-center">Quem faz a Frigga</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {team.map(member => (
                <TeamMemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Chamadas para ação */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto bg-[var(--color-navy)] rounded-2xl p-8 md:p-12 text-center text-white shadow-xl">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">Pronto para encontrar o que precisa?</h2>
          <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
            Nossa equipe técnica está à disposição para auxiliar no dimensionamento e na escolha correta dos componentes para o seu projeto de refrigeração.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={`https://wa.me/${storeConfig.whatsappNumber}?text=${encodeURIComponent("Olá! Estou no site da FriggaFrio e gostaria de falar com a equipe técnica.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-8 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <PhoneCall className="w-5 h-5" />
              Fale pelo WhatsApp
            </a>
            <Link
              to="/nossa-loja"
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white hover:bg-white hover:text-[var(--color-navy)] text-white font-bold py-3 px-8 rounded-xl transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Conheça nossas lojas
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}
