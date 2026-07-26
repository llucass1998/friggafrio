import { useState, useMemo } from "react"
import { Search, ChevronDown, MessageCircle, Mail, MapPin } from "lucide-react"

// Conteúdo inspirado na Dufrio (políticas e processos logísticos) mas 100% autoral na redação,
// focado para a realidade B2B/B2C da FriggaFrio com foco em equipamentos pesados, gases e infraestrutura

const faqData = [
  {
    category: "Pedidos e Faturamento",
    questions: [
      {
        q: "Quais são as formas de pagamento disponíveis?",
        a: "Para facilitar suas compras, aceitamos PIX (com aprovação imediata e desconto exclusivo), Cartões de Crédito (Visa, Mastercard, Elo, Amex) com parcelamento em até 10x sem juros, e Boleto Bancário à vista. Para instaladores e parceiros B2B com cadastro ativo, também oferecemos opções de faturamento faturado sujeito à análise de crédito."
      },
      {
        q: "Posso alterar a forma de pagamento de um pedido já fechado?",
        a: "Após a conclusão do pedido, não é possível alterar a forma de pagamento por questões de segurança bancária. Se o seu pagamento via cartão não for aprovado ou o boleto vencer, o pedido será cancelado automaticamente e você poderá realizar uma nova compra."
      },
      {
        q: "Como faço para atualizar meus dados cadastrais?",
        a: "É simples! Acesse a aba 'Minha Conta' no canto superior direito do site e vá até a seção 'Perfil'. Lá você poderá atualizar seus telefones, e-mails e senha de acesso a qualquer momento."
      },
      {
        q: "É possível adicionar ou remover itens de um pedido finalizado?",
        a: "Não. Para garantir a velocidade no processo de expedição, assim que o pedido é confirmado e entra em faturamento não conseguimos incluir nem remover itens. Sugerimos realizar um pedido adicional."
      }
    ]
  },
  {
    category: "Logística e Entregas",
    questions: [
      {
        q: "Qual o prazo de entrega para equipamentos grandes (Câmaras, Compressores e Gases)?",
        a: "O prazo de entrega e o valor do frete variam conforme o CEP de destino e o volume dos produtos. Na FriggaFrio, trabalhamos com transportadoras homologadas para manuseio de fluidos refrigerantes e equipamentos pesados, garantindo que cheguem intactos. Insira o seu CEP na página do produto ou no carrinho para visualizar o prazo exato."
      },
      {
        q: "Como acompanho a localização do meu pedido?",
        a: "Assim que sua compra for despachada, um e-mail contendo a Nota Fiscal e o link direto de rastreio da transportadora será enviado para você. Você também pode acompanhar o passo a passo acessando 'Meus Pedidos' na sua conta."
      },
      {
        q: "Meu pedido está atrasado, como devo proceder?",
        a: "Se o prazo estimado expirou, por favor entre em contato imediatamente com nossa equipe através do WhatsApp ou do e-mail de atendimento. Iremos contatar a transportadora e resolver o gargalo o mais rápido possível."
      },
      {
        q: "Posso retirar os produtos diretamente na loja física?",
        a: "Sim! Oferecemos a modalidade 'Retirada na Loja'. Durante a finalização da compra, basta selecionar essa opção, caso disponível para os itens no carrinho. Aguarde sempre o e-mail de confirmação de que os produtos já estão separados antes de se dirigir à unidade."
      }
    ]
  },
  {
    category: "Garantia e Devoluções",
    questions: [
      {
        q: "Quais são as políticas de garantia dos compressores e peças?",
        a: "Todos os nossos produtos contam com a garantia legal de 90 (noventa) dias contra defeitos de fabricação, conforme o Código de Defesa do Consumidor. Alguns fabricantes de equipamentos pesados (como compressores herméticos e condensadores) fornecem garantia estendida de 1 a 3 anos. Guarde sua Nota Fiscal para eventuais acionamentos."
      },
      {
        q: "Como funciona a troca ou devolução por arrependimento?",
        a: "Para compras realizadas pelo site, você possui o direito de arrependimento no prazo de até 7 dias corridos após o recebimento. O produto deve ser devolvido exatamente como foi entregue: na embalagem original, sem vestígios de uso, instalação ou solda, acompanhado de todos os manuais, acessórios e a Nota Fiscal."
      },
      {
        q: "O produto chegou amassado ou avariado. O que fazer?",
        a: "Atenção no momento do recebimento! É responsabilidade do recebedor conferir as condições da mercadoria. Caso note a embalagem violada, caixas rasgadas, ou equipamentos amassados, RECUSE a entrega imediatamente fazendo uma ressalva no verso do conhecimento de transporte (CTe) do motorista e nos avise no mesmo dia. Se a avaria for percebida somente após abrir, contate-nos no prazo máximo de 7 dias com fotos nítidas do produto e da embalagem."
      }
    ]
  },
  {
    category: "Atendimento Técnico e Projetos",
    questions: [
      {
        q: "Vocês desenvolvem o projeto completo de câmara fria?",
        a: "Nós comercializamos todos os insumos, equipamentos, gases, ferramentas e painéis isolantes para a montagem de câmaras frigoríficas completas, atuando como um fornecedor centralizado. Contudo, não executamos a mão de obra de instalação ou elaboração de projetos de engenharia em si. Recomendamos consultar seu instalador ou engenheiro de refrigeração de confiança."
      },
      {
        q: "Preciso de ajuda para dimensionar a capacidade do compressor. Vocês auxiliam?",
        a: "Nossos consultores técnicos de vendas possuem experiência na área e estão prontos para te orientar na escolha dos componentes baseados na carga térmica estimada do seu ambiente ou na reposição da peça equivalente. Fale conosco no WhatsApp para suporte pré-venda."
      }
    ]
  }
]

export default function AjudaPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [openQuestionIndex, setOpenQuestionIndex] = useState<string | null>(null)

  const toggleQuestion = (id: string) => {
    setOpenQuestionIndex(prev => prev === id ? null : id)
  }

  // Filtra as perguntas com base na busca do usuario
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return faqData

    const lowerSearch = searchTerm.toLowerCase()

    return faqData.map(category => {
      const filteredQuestions = category.questions.filter(
        q => q.q.toLowerCase().includes(lowerSearch) || q.a.toLowerCase().includes(lowerSearch)
      )
      return { ...category, questions: filteredQuestions }
    }).filter(category => category.questions.length > 0)

  }, [searchTerm])

  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] pb-12 font-sans">
      {/* Header Banner - Design mais limpo e imersivo */}
      <section className="bg-[var(--color-navy)] pt-16 pb-20 px-4 relative overflow-hidden">
        {/* Decorativo sutil */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-5 pointer-events-none">
          <svg className="absolute -top-32 -left-32 w-[600px] h-[600px] text-white" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
          <svg className="absolute top-1/2 -right-20 w-[400px] h-[400px] text-[var(--color-accent)]" fill="currentColor" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="50" />
          </svg>
        </div>

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-blue-100 text-sm font-medium mb-6">
            <MessageCircle className="w-4 h-4" />
            Central de Atendimento FriggaFrio
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Como podemos ajudar você?
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-light">
            Encontre respostas rápidas para dúvidas sobre pedidos, fretes, garantias e suporte comercial.
          </p>

          {/* Search Bar Melhorada */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="h-6 w-6 text-gray-400 group-focus-within:text-[var(--color-primary)] transition-colors" />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-6 py-5 bg-white border-0 rounded-[var(--radius-button)] text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[var(--color-accent)] focus:outline-none shadow-xl text-lg transition-all"
              placeholder="Digite sua dúvida (ex: prazo de entrega, pix, devolução)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 -mt-10 relative z-20">

        {filteredData.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-lg border border-[var(--color-border)]">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-3">Nenhum resultado encontrado</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Não conseguimos encontrar respostas contendo "{searchTerm}". Verifique a ortografia ou limpe a pesquisa.
            </p>
            <button
              onClick={() => setSearchTerm("")}
              className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-[var(--radius-button)] hover:bg-gray-200 transition-colors"
            >
              Limpar pesquisa
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {filteredData.map((category, catIndex) => (
              <div key={category.category} className="bg-white rounded-[24px] shadow-sm border border-[var(--color-border)] p-6 md:p-10">
                <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-8 flex items-center gap-4">
                  <span className="w-1.5 h-8 bg-[var(--color-primary)] rounded-full"></span>
                  {category.category}
                </h2>

                <div className="space-y-4">
                  {category.questions.map((item, qIndex) => {
                    const id = `${catIndex}-${qIndex}`
                    const isOpen = openQuestionIndex === id

                    return (
                      <div
                        key={id}
                        className={`rounded-2xl transition-all duration-200 ${
                          isOpen
                            ? "bg-blue-50/50 ring-1 ring-[var(--color-primary)]/20"
                            : "bg-gray-50/50 hover:bg-gray-50"
                        }`}
                      >
                        <button
                          onClick={() => toggleQuestion(id)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-2xl"
                          aria-expanded={isOpen}
                        >
                          <span className={`font-semibold text-lg pr-4 transition-colors ${isOpen ? 'text-[var(--color-primary)]' : 'text-[var(--color-navy)]'}`}>
                            {item.q}
                          </span>
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${isOpen ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] rotate-180" : "bg-white text-gray-400 shadow-sm border border-gray-100"}`}>
                            <ChevronDown className="w-5 h-5" />
                          </div>
                        </button>

                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="px-6 pb-6 pt-1 text-gray-600 leading-relaxed font-medium">
                              {item.a}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Contact Block Modernizado */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-[var(--color-navy)] to-blue-950 rounded-[24px] p-8 md:p-10 text-white relative overflow-hidden group shadow-lg">
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/5 rounded-full group-hover:scale-110 transition-transform duration-700 ease-in-out"></div>
            <MessageCircle className="w-12 h-12 text-[var(--color-accent)] mb-6" />
            <h3 className="text-2xl font-bold mb-3">Ainda com dúvidas?</h3>
            <p className="text-blue-100 mb-8 leading-relaxed font-light">
              Nossa equipe de especialistas está pronta para te atender no WhatsApp e tirar todas as suas dúvidas técnicas e comerciais.
            </p>
            <a
              href="https://wa.me/551145801227"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-[var(--radius-button)] transition-transform hover:-translate-y-1 w-full sm:w-auto shadow-lg shadow-[#25D366]/20"
            >
              Falar no WhatsApp
            </a>
          </div>

          <div className="bg-white rounded-[24px] p-8 md:p-10 border border-[var(--color-border)] shadow-sm flex flex-col justify-center">
            <h3 className="text-2xl font-bold text-[var(--color-navy)] mb-8">Canais Alternativos</h3>

            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="bg-blue-50 p-4 rounded-2xl text-[var(--color-primary)]">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-navy)] mb-1">Televendas e E-mail</h4>
                  <a href="mailto:vendas@frigga.com.br" className="text-gray-600 hover:text-[var(--color-primary)] transition-colors block">
                    vendas@frigga.com.br
                  </a>
                  <span className="text-gray-600">(11) 4580-1227</span>
                </div>
              </div>

              <div className="flex items-start gap-5">
                <div className="bg-blue-50 p-4 rounded-2xl text-[var(--color-primary)]">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--color-navy)] mb-1">Matriz FriggaFrio</h4>
                  <p className="text-gray-600">
                    Rua Anhaia, 345 - Bom Retiro<br />
                    São Paulo - SP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>
    </div>
  )
}
