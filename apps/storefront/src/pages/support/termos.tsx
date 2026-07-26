export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-soft)] pb-12 font-sans">
      <section className="bg-[var(--color-navy)] pt-16 pb-20 px-4 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Termos e Condições de Uso
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-2xl mx-auto font-light">
            Ao utilizar o site da FriggaFrio, você concorda com as políticas e diretrizes a seguir estabelecidas.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 md:py-16 -mt-10 relative z-20">
        <div className="bg-white rounded-[24px] shadow-sm border border-[var(--color-border)] p-8 md:p-12 space-y-8 text-gray-700 leading-relaxed">
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              1. Disposições Gerais
            </h2>
            <p>
              Estes Termos de Uso aplicam-se a todos os serviços prestados pela <strong>FriggaFrio</strong> através deste e-commerce, com foco no atendimento a profissionais e empresas (B2B) e consumidores finais (B2C) do setor de refrigeração e climatização.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              2. Especificações dos Produtos
            </h2>
            <p>
              A seleção, instalação e aplicação de fluidos refrigerantes e equipamentos como compressores herméticos e condensadores devem obedecer estritamente aos manuais do fabricante. A FriggaFrio comercializa os insumos, não sendo responsável por vícios decorrentes de instalação imperita, negligente ou fora das normas regulamentadoras aplicáveis.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              3. Propriedade Intelectual
            </h2>
            <p>
              Todo o conteúdo, logotipo, design, marca e layout expostos no site são de propriedade da FriggaFrio, sendo vetada qualquer reprodução total ou parcial sem anuência por escrito, sujeito às penalidades da Lei de Propriedade Industrial vigente.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-4 flex items-center gap-4">
              <span className="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></span>
              4. Alteração dos Termos
            </h2>
            <p>
              Reservamo-nos o direito de alterar, a qualquer momento, e sem aviso prévio, os presentes Termos de Uso visando melhorias comerciais, regulatórias ou do sistema. Sugerimos conferir esta página regularmente.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
