# Catálogo FriggaFrio — diagnóstico e implementação local

Referência de produção: 24/10/2026. Revisão: 25/10/2026. Branch `Maestro`, base `c073c42`.
**Sem commit, push, deploy, migration ou alterações comerciais em produção nesta etapa.**

## Correção deste relatório
As tabelas anteriores confundiam cenários da fixture e comparavam hardwares/datasets diferentes como ganho comprovado. Foram retiradas as alegações de redução de 99%, SKU de 125 ms, HIT otimizado de 9–15 ms e LCP pós-implementação. Os valores de navegador de 420–544 ms pertencem ao diagnóstico de produção anterior, não ao novo código. Não há medição “depois em produção”.

## Diagnóstico de produção, somente leitura
Cinco buscas SKU distintas com MISS natural, cada uma seguida de cinco repetições aquecidas:

| Cenário | Amostras/resultado |
|---|---|
| API busca SKU sem cache | 19.316 / 20.490 / 21.681 / 24.204 / 20.624 ms; mediana 20.624 ms, p95 amostral 24.204 ms |
| API busca SKU aquecida | Predominantemente 9–40 ms; outliers 88 e 402 ms |
| Filtro estoque, primeiro acesso da página | 21,3 s; repetições aproximadamente 0,37–0,56 s |
| `/store/products`, 24 cards | 269 / 183 / 154 / 293 / 138 ms |
| `/br/store`, TTFB curl no host | 354–579 ms |
| Navegador real, primeiros cards | 3353 / 753 / 544 / 420 / 427 ms |
| Navegador real, LCP | 3448 / 848 / 644 / 524 / 528 ms |
| Home → Catálogo | 428 / 588 / 438 / 416 / 391 ms |
| Facetas aquecidas | 48–105 ms, aproximadamente 956.568 caracteres JSON e 179 KB transferidos |
| Redis PING | 0,39–0,58 ms; sem evicções |
| Redis INFO global | 13.900 hits, 229 misses: 98,38%. Inclui sessões/outros consumidores, não taxa específica do catálogo |

A página inicial amostrada tinha placeholders sem thumbnails de produtos; não atribuir sua latência a imagens ausentes. CPU/load do host variou e afeta comparações. PostgreSQL tinha cinco conexões e zero deadlocks na observação. `pg_stat_statements` não estava instalado: não houve ranking histórico completo nem contagem de todas as queries por request.

EXPLAIN ANALYZE de SELECTs read-only com timeout 3 s: produtos amplos 10,96 ms; SKU exato 0,253 ms; inventário amplo 2,91 ms. A amostragem de SQL ativo não encontrou uma query individual explicando os 20 segundos. A expansão Graph, materialização de relações e filtragem de milhares de registros por MISS são os gargalos identificados no código. Isso não prova que todo o tempo seja bloqueio síncrono do event loop.

## Implementação
- `public-query.ts`: seleção parametrizada de candidatos, variantes, agregação, total e página no PostgreSQL, sem expandir catálogo Graph no request. Usa conexão Medusa registrada. Respeita canal público, publicação, exclusões, opções, reservas e semântica de preço mínimo. Guarda de canal/região obrigatórios.
- Rotas search/facets: adaptador atrás de `CATALOG_SQL_QUERY_ENABLED=true`; flag ausente mantém caminho legado. Erro no novo caminho retorna indisponibilidade, não fallback silencioso nem total fabricado.
- Pricing: por padrão usa `IPricingModuleService.calculatePrices` em lotes. Fast-path de preço-base exige **também** `CATALOG_BASE_PRICE_EQUIVALENCE_APPROVED=true`, inexistência de listas/regras/faixas/ambiguidade e contexto público sem autenticação/cookies. Não habilitar esse segundo gate sem teste diferencial contra pricing oficial no ambiente alvo. Contexto de grupos segue o middleware oficial instalado. Cards continuam com `calculated_price` oficial.
- Facetas: marcas/preço agregados; opções somente com categoria selecionada, preservando valores/URLs sem cortar cardinalidade silenciosamente.
- Cache v2: chave hash por contexto/página/canal/região, single-flight local, lease Redis, epoch e TTL 30/60s. Bypass para requests com cookies/autorização/ator e projeção de preços com listas temporais. Eventos de produtos, preços, inventário, regiões/canais e sync Omie invalidam v2 após persistência. O cache legado segue seu TTL original no rollback.
- Loader: reutilização de regiões, categoria ID sem lookup por handle, campos de card enxutos preservando `images.url`; hidratação somente por IDs; erro explícito se IDs não hidratam. Sem fallback que filtra depois da paginação e conserva total incorreto. Skeleton de navegação acessível.

## Maps e paginação DPGS
**Maps:** faltava chave no ambiente de build de produção. Não resolver com credencial hardcoded. Chave removida do componente e do HTML estático; iframe relativo ao host atual; build de produção falha se a chave faltar (`GOOGLE_MAPS_EMBED_KEY_REQUIRED_FOR_BUILD`). `.env` não versionado. Navegador local com API fixture confirmou iframe presente, fallback ausente e endereço correto para Loja 1/2/3. Permissões Google/referrer no domínio público dependem da chave configurada no release, não foram alteradas nem homologadas em produção.

**DPGS Admin:** causa real no patch `patches/@medusajs__dashboard@2.18.0.patch`: `offset: 0` fixo e queryKey sem página. Corrigido em `src` e `dist` do patch: incluir `searchParams` na key, usar offset corrente, preservar demais filtros e retirar `q` da hidratação por IDs. Página vazia não cai na lista genérica. Lockfile atualizado pelo pnpm 10.12.3, patch reaplicado com install offline frozen. Teste executa a queryFn do patch e confirma offsets **0/20/40/20**. O wrapper React `cache` de `searchCatalog` não era causa comprovada desse bug; a afirmação anterior foi incorreta.

## Benchmark isolado (não é comparativo direto de produção)
Fixture transacional descartável com **11.050 produtos**, PostgreSQL local, execução Windows com túnel local, sem dados comerciais reais. Banco e schema são desfeitos com ROLLBACK. Testa count >10k, texto acentuado, SKU, estoque, categoria/marca, preço combinado, opções, páginas distintas e página vazia. Cinco execuções sem Redis por cenário; cache de buffers PostgreSQL pode estar aquecido. Portanto não chamar essas amostras de MISS Redis nem prometer ganho percentual em produção.

| Cenário | Cinco amostras locais (ms) | Queries explícitas por execução |
|---|---|---|
| Catálogo geral | 1254 / 154 / 147 / 179 / 170 | 2 |
| SKU | 2573 / 1515 / 1650 / 1904 / 1761 | 2 |
| Nome | 455 / 507 / 454 / 463 / 472 | 2 |
| Estoque | 143 / 143 / 141 / 132 / 133 | 2 |
| Categoria/marca | 150 / 138 / 156 / 161 / 143 | 2 |
| Preço + estoque + sort | 318 / 303 / 322 / 316 / 354 | 3 (fast-path da fixture) |
| Opções | 181 / 182 / 236 / 210 / 185 | 2 |
| Página vazia | 154 / 154 / 157 / 173 / 153 | 2 |

Facetas da fixture: 131 caracteres (uma marca, sem categoria). Não são dados iguais às facetas reais de 956 KB, logo não há redução percentual comparável comprovada. A busca SKU ainda é a parte SQL mais cara (~1,5–2,6 s neste ensaio), precisa de teste de índices textual/explain na base representativa antes de prometer meta de 500 ms a frio. Não foi criada migration de índice em produção.

## Validações e limitações
- Rodada final: backend **514 testes / 96 suites** aprovados; storefront **229 testes** aprovados. Typecheck dos dois projetos aprovado. Builds oficiais backend/Admin e storefront aprovados com source-integrity guard. `git diff --check` aprovado. Lint focado sem erros (warnings preexistentes); lint global storefront permanece com quatro erros preexistentes listados abaixo.
- Testes novos: paginação real da queryFn do Dashboard, preço delegado por padrão, relevance vazio, paginação SQL >10k, concorrência cache (10 chamadas → 1 compute), separação de contexto e epoch mudando durante cálculo.
- Lint global storefront tem quatro erros preexistentes em `public-product-specs.ts` e `routes/$countryCode/account/login.tsx`, além de warnings; não foram corrigidos fora do escopo nem escondidos.
- A fixture não substitui homologação completa Medusa + preços por região/grupos/listas/impostos, atualização Omie E2E e navegador com backend real. Flag SQL deve permanecer desligada até esses gates passarem.
- Política de estoque preserva o adaptador legado (saldo por item somado entre locais), sem migração de política de local/canal ou `required_quantity`; revisar contrato separadamente se checkout voltar a ser habilitado.
- Não houve benchmark A/B no mesmo hardware/dataset contra o Graph legado; **não apresentar 99% de ganho comprovado**.

## Publicação futura e rollback
1. Não publicar automaticamente. Confirmar runbooks/pipeline Git/WSL e aprovação específica.
2. Configurar Maps no ambiente de build e validar permissões/referrers Google nos dois domínios antes da troca de release.
3. Instalação frozen do patch e teste Admin DPGS: páginas 1/2/3, voltar, busca exata, filtro de status e página vazia.
4. SQL desabilitado por padrão; habilitar somente após gates comerciais. Rollback: desabilitar flag e reiniciar via pipeline aprovado; cache v2 isolado por namespace/epoch, sem FLUSH/KEYS. Reverter release se necessário. Nenhum DROP ou alteração de preços/estoque é parte do rollback.
5. Preservado arquivo preexistente não rastreado `apps/.admin-build.tar.gz`.
