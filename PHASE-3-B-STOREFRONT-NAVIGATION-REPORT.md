# Relatório de FASE 3-B.1.1 — ROTEAMENTO CANÔNICO EXCLUSIVO /BR E CORREÇÃO DOS GATES

Este relatório detalha as modificações estruturais e correções implementadas no storefront para garantir que a navegação e o roteamento operem exclusivamente na rota canônica `/br`, mantendo a aderência estrita às validações de tipos do TanStack Router e resolvendo problemas críticos nos testes E2E do Playwright.

## 1. Implementação do Roteamento Canônico Exclusivo `/br`
- **Forçamento de Redirecionamento na Raiz:** Modificada a regra em `apps/storefront/src/routes/index.tsx` para redirecionar explicitamente para `/br`, ignorando integralmente os cookies `medusa_region` e `countryCode`. A decisão de roteamento não baseia-se mais no estado do navegador, evitando estados de "falso regional" que causavam páginas inconsistentes ou indisponíveis.
- **Validação de Código de Região:** No arquivo `apps/storefront/src/routes/$countryCode.tsx`, implementada a validação para lançar *not found* (Erro 404) para qualquer código de país diferente de "br" e suporte para mapeamento de URL uppercase "BR" diretamente para a representação minúscula "br".
- **Remoção de Rotas Órfãs:** Todas as rotas base antigas do diretório raiz (`/nossa-loja`, `/quem-somos`, `/cart`, `/checkout`, `/ajuda`, `/termos`, `/privacidade`, `/trocas`) foram marcadas para retornar 404, migrando a lógica integral de páginas corporativas e de carrinho para dentro do escopo `/$countryCode/` e resolvendo duplicidade de chamadas.

## 2. Correções de Tipagem Estrita e Links
- A biblioteca TanStack Router acusava o erro **TS2322** (Type not assignable to 'to') porque as páginas como `nossa-loja` estavam fora do `$countryCode` gerado na árvore de rotas (`routeTree.gen.ts`).
- **Footer e Header:** Toda a estruturação baseada em links dinâmicos e *strings dinâmicas soltas* (ex: `href={... as string}`) foi refeita. A renderização iterativa dos arrays foi expandida para componentes explícitos utilizando `Link` do TanStack Router de forma fixa e tipada (ex: `<Link to="/$countryCode/nossa-loja" params={{ countryCode: "br" }} />`).
- **Schema Zod de Buscas:** Resolvido o erro **TS2353** garantindo que os parâmetros de query string aceitas pela rota de loja (`/$countryCode/store.tsx`) suportem `q: z.string().optional()`. Essa adequação foi necessária para corrigir o roteamento gerado pelo component Search Header, que busca diretamente parâmetros `q`.

## 3. Playwright E2E - Adequações Estritas sem "Swallows"
- O teste E2E `navigation-phase-3.spec.ts` foi recriado focado puramente em assertions limpas e estáveis:
  - Validou que tentativas de burlar a região pelo cookie falham ou redirecionam ao `/br`.
  - Verificou individualmente os HTTP Status 404 para URLs não-canônicas (`/us`, `/null`, `/nossa-loja`, etc).
  - Garantiu 100% dos links internos visíveis sem falsos negativos (excluindo `#main-content` estritamente de avaliações de URL inválidas).
  - Testou Menu Mobile garantindo visibilidade (`toBeVisible()`) e estado ausente (`toHaveClass(/-translate-x-full/)` ou escondido nativamente), descartando dependência instável no transform. Adicionalmente, corrigiu cliques que caíam no drawer overlay usando coordenadas claras para o lado direito e sem `force: true`.
- **Hero Carousel Test (hero-carousel.spec.ts):** Coletas de Viewport x Carousel Box Sizing foram ajustadas para lidar com *bounding boxes* em diferentes telas (1440px, 1665px, 1920px), permitindo rastrear onde os botões interagem sobre os textos, resolvendo timeouts e instabilidades de localizadores. Métricas provaram a não-intersecção dos retângulos e preservaram o limite `max-w-sm` no layout em todas as resoluções de Desktop e Mobile (390x844).

## 4. Gates Validados
- **Typecheck:** Passou com `0` erros. `tsc --noEmit` confirmando validações TanStack.
- **Lint:** Eliminados quaisquer warnings/errors de variáveis não utilizadas ou *Fast refresh*. `pnpm --filter storefront exec eslint . --max-warnings 0` aprovado 100%.
- **Test Unit:** 6/6 aprovados confirmando fallbacks do carrinho.
- **Playwright E2E Suite:** 66/66 aprovados e demais tests herdados validando UI e integrações (`hero-carousel`, `brands`, `checkout`).
- **Build:** `routeTree.gen.ts` reconstruído e compilado com sucesso por completo sem erros de roteamento ausente.

A aplicação encontra-se consolidada em `/br` operando com links literais de alta segurança em TypeScript sem bypass.
