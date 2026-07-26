export default function TrocasPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] pb-12 font-sans">
      <section className="bg-[var(--color-navy)] pt-16 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Política de Trocas e Devoluções
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-light">
            Orientações de acionamento de garantias e diretrizes comerciais da FriggaFrio.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 -mt-10 relative z-20">
        <div className="bg-white rounded-[24px] shadow-sm border border-[var(--color-border)] p-8 md:p-12 space-y-8 text-gray-700 leading-relaxed">
          
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              Direito de Arrependimento
            </h2>
            <p>
              Em obediência ao Código de Defesa do Consumidor, compras realizadas através do site concedem um prazo de até <strong>7 (sete) dias corridos</strong> após a assinatura de entrega para formalização da devolução por arrependimento. O equipamento (gases, ferramentas ou compressores) deve estar intacto, na embalagem original, inviolada, sem resíduos químicos, de instalação ou marcas de solda, além de estar acompanhado dos manuais e da Nota Fiscal de origem.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              Garantia e Análise Técnica
            </h2>
            <p>
              Produtos com defeito de fábrica possuem garantia legal de 90 dias, e em alguns maquinários pesados os prazos podem ser estendidos pela política própria do fabricante (ex: 1 ano para compressores selados). O envio do material defeituoso será submetido ao laudo técnico do fabricante. Caso seja comprovado defeito estrutural (e não imperícia de manuseio ou instalação, como falta de vácuo em sistemas de AC, quebra elétrica, etc.), a FriggaFrio mediará a imediata reposição do material ou reembolso integral.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              Avarias Logísticas
            </h2>
            <p>
              É de responsabilidade do titular conferir a mercadoria no momento da transportadora. Ao detectar caixas avariadas, amassados nos evaporadores ou embalagem violada, RECUSE a entrega, registre a avaria no conhecimento de transporte e comunique nossa Central de Atendimento no mesmo dia para acionamento do seguro de carga e reenvio dos materiais.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}
