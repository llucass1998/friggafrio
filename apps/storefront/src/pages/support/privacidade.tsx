export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] pb-12 font-sans">
      <section className="bg-[var(--color-navy)] pt-16 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Política de Privacidade (LGPD)
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-light">
            Entenda como a FriggaFrio protege e trata os seus dados comerciais e pessoais com transparência.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 -mt-10 relative z-20">
        <div className="bg-white rounded-[24px] shadow-sm border border-[var(--color-border)] p-8 md:p-12 space-y-8 text-gray-700 leading-relaxed">
          
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              Coleta de Dados
            </h2>
            <p>
              Ao realizar uma compra, cadastro B2B ou solicitar um orçamento, a FriggaFrio coleta informações estritamente essenciais para a emissão de nota fiscal e transporte da mercadoria (como CNPJ/CPF, Razão Social, Inscrição Estadual, e-mail, telefone e endereço).
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              Armazenamento e Segurança
            </h2>
            <p>
              Empregamos protocolos modernos (SSL/TLS e criptografia de banco de dados no Medusa) para garantir que sua navegação, cadastro de identidade federada via Google ou autenticações internas sejam transmitidas em um ambiente absolutamente seguro, sem vazamento a terceiros. 
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              Compartilhamento Necessário
            </h2>
            <p>
              Somente compartilhamos seus dados de destinatário (nome e endereço de faturamento/entrega) com as nossas transportadoras logísticas e com o gateway de pagamento (Mercado Pago / Gateway de Cartões) com o único intuito de processar a compra, entrega e compliance fiscal, sempre limitados ao escopo do serviço exigido.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}
