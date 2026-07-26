# FriggaFrio — Recuperação TypeScript do storefront

Data da validação: 2026-07-26
Workspace: `storefront`
Resultado do objetivo TypeScript: 12 erros corrigidos, 0 restante
Gate completo da fase: reprovado por lint global e navegador indisponível

## Baseline e correções

| # | Área | Arquivo/linha anterior | Mensagem anterior | Causa | Correção | Teste criado ou atualizado |
|---:|---|---|---|---|---|---|
| 1 | Carrinho/navbar | `components/navbar.tsx:21` | `Cannot find name 'getCartItemCount'` | Helper existente não importado | Import canônico de `lib/utils/cart` | Script `typecheck`; lint dos arquivos impactados |
| 2 | Store API/componente | `components/public-product-card.tsx:46` | Campo `reason` não existe em `select_variant` | Objeto não respeitava a união discriminada | Fornece `variants` tipadas; remove `any` dos preços/variantes | `typecheck`; lint impactado; build client/SSR |
| 3 | Autenticação | `lib/context/auth-context.tsx:92` | `token` não existe em `AuthLoginResponse` | Login pode retornar string ou etapa adicional | Narrowing por `typeof`; etapa adicional falha de forma controlada | `typecheck`; lint impactado |
| 4 | Autenticação | `lib/context/auth-context.tsx:94` | `token` não existe em `AuthLoginResponse` | Persistência manual duplicava responsabilidade do SDK | SDK passa a gerenciar a sessão; acesso inválido removido | `typecheck`; build SSR |
| 5 | Autenticação/SSR | `lib/medusa.ts:9` | `"token"` não é `"jwt" \| "session"` | Configuração de versão antiga do SDK | `type: "session"` e credenciais incluídas, coerente com o backend | `typecheck`; lint impactado; build SSR |
| 6 | Carrinho | `pages/cart.tsx:39` | `Cannot find name 'getCartItemCount'` | Helper existente não importado | Import explícito do helper | `typecheck`; lint impactado |
| 7 | Pedidos/rotas | `pages/orders.tsx:422` | Rota `/$countryCode/orders` não existe | Caminho divergia da árvore TanStack | Usa `/$countryCode/account/orders` | Validação tipada do router no `typecheck` |
| 8 | Pedidos/rotas | `pages/orders.tsx:423` | Parâmetro `countryCode` incompatível | O destino inexistente impedia inferência dos params | Params passam a ser inferidos pela rota real | Validação tipada do router no `typecheck` |
| 9 | Pedidos/navegação | `pages/orders.tsx:424` | Busca `{}` incompatível | Schema de busca não era associado ao destino incorreto | Busca vazia validada na rota que declara `orderId?` | `typecheck`; bundle de pedidos gerado |
| 10 | Orçamentos/rotas | `pages/quotes.tsx:404` | Rota `/$countryCode/orders` não existe | Orçamento navegava para caminho inexistente | Usa a rota canônica de pedidos | Validação tipada do router no `typecheck` |
| 11 | Orçamentos/rotas | `pages/quotes.tsx:405` | Parâmetro `countryCode` incompatível | Inferência quebrada pelo destino inexistente | Params validados pela rota real | `typecheck`; bundle de orçamentos gerado |
| 12 | Orçamentos/navegação | `pages/quotes.tsx:406` | `orderId` incompatível com search | Destino não declarava o schema de busca esperado | Navegação aponta para rota com `orderId` opcional | `typecheck`; build client/SSR |

## Ajustes correlatos obrigatórios

- O Auth Context deixou de imprimir dados de autenticação e cookies.
- O contexto e o hook foram separados para respeitar Fast Refresh.
- O login Google passou a enviar cookies de sessão com `credentials: "include"`.
- O tipo do preview de orçamento passou a representar `variant_id`/`variant` sem
  coerção para `any`.
- Os arquivos impactados passam no ESLint com 0 erro e 0 warning.

## Evidências

| Gate | Resultado |
|---|---|
| `pnpm --filter storefront typecheck` | Aprovado, 0 erro |
| ESLint somente nos arquivos impactados | Aprovado, 0 erro e 0 warning |
| `pnpm --filter storefront build` | Client e SSR aprovados |
| Bundle client principal | 759,04 kB; warning de chunk grande |
| Bundle SSR `region` | 632,57 kB; warning de chunk grande |
| Lint global | Reprovado: 528 erros e 94 warnings |
| Navegação manual | Bloqueada: navegador integrado não disponível |

Os warnings de tamanho são tratados na Fase 31. O passivo de lint global é tratado na
Fase 11. Até esses gates serem aprovados e a navegação ser inspecionada em navegador,
esta fase permanece formalmente reprovada.
