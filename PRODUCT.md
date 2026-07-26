# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Clientes B2B (instaladores, técnicos refrigeristas, empresas de manutenção) e B2C (consumidores finais) buscando peças, ferramentas, gases refrigerantes e equipamentos de ar condicionado.

## Product Purpose
Ser o principal canal de vendas digitais da FriggaFrio, oferecendo um catálogo técnico, confiável e rápido para profissionais e consumidores encontrarem exatamente o que precisam para refrigeração e ar condicionado.

## Positioning
Loja especializada com profundo conhecimento técnico em refrigeração, vendendo produtos originais com foco em gases refrigerantes e componentes críticos, onde a confiança na qualidade do material é inegociável.

## Operating Context
O usuário frequentemente acessa via mobile enquanto está em campo (numa obra ou manutenção) ou via desktop no escritório fazendo orçamentos. Eles precisam de especificações técnicas claras (peso, compatibilidade de gás, voltagem) rapidamente.

## Capabilities and Constraints
- Plataforma baseada no Medusa v2 (Backend) e Storefront React 19 / Tailwind 4.
- SSR ativado (sem `suppressHydrationWarning` ou `use client` desnecessários).
- Preços sempre em BRL (`pt-BR`, `BRL`).
- Sem botões genéricos de "Indisponível" caso haja preço configurado.
- Carrinho via Drawer com animações suaves (quando `motion-reduce` não estiver ativo).
- O backend é a fonte da verdade para cálculo de preços e disponibilidade de estoque.

## Brand Commitments
- Nome: FriggaFrio
- Identidade visual focada no universo do "frio": Azul corporativo, azul-gelo, branco e tons neutros (cinza/grafite).
- Tom de voz: Profissional, técnico, direto e confiável.
- Respeito à preferência de `Reduced Motion` dos usuários.

## Evidence on Hand
- Catálogo de produtos reais sendo consumidos da API Medusa.
- Logo/Identidade baseada em cores frias.
- Endereços físicos e contatos (WhatsApp, Telefone, E-mail) já configurados no `storeConfig`.

## Product Principles
1. **Verdade Técnica**: Informações, fichas técnicas e manuais devem ser fáceis de encontrar e precisos.
2. **Confiança e Segurança**: O visual deve transmitir robustez corporativa, afastando-se de templates genéricos fracos.
3. **Fricção Zero no Campo**: A interface mobile deve ser excepcionalmente responsiva e fácil de usar sob luz do sol ou com pressa.
4. **Desempenho First**: SSR e carregamento rápido para não frustrar o técnico que busca uma peça no meio do 4G instável.

## Accessibility & Inclusion
Alto contraste nas cores de leitura (Azul escuro/Grafite sobre fundo claro). Suporte amigável para redução de animações (`prefers-reduced-motion`). Zonas de toque (touch targets) adequadas para mobile (mínimo 44px).
