# Fase 5 — Omie Discovery (read-only)

## Estado

- Gate 4 permanece PASS no commit `c014d1524aa02adb3259148fea1067a92760451c`.
- Omie não estava implementada no repositório auditado.
- Nenhuma credencial Omie está disponível no ambiente local (`OMIE_ENV_NAMES=NONE`).
- Nenhuma chamada Omie foi executada e nenhum dado foi gravado no Medusa.
- Gate 5 permanece bloqueado até existir fonte comercial real e aprovada.

## Fonte de verdade

Catálogo, preço e estoque continuam `UNRESOLVED`. A decisão entre Omie master,
Medusa master ou modelo híbrido exige confirmação do negócio. A implementação
mantém a arquitetura `Omie -> integration layer -> Medusa` e nunca conecta o
Storefront diretamente à Omie.

## Implementação estrutural

`apps/backend/src/integrations/omie/` contém:

- `OmieClient`, com POST JSON-RPC compatível com a API Omie, timeout, tentativas
  limitadas, backoff/jitter, respeito a `Retry-After` e erros sanitizados;
- `OmieCatalogReader`, que pagina `ListarProdutos` em modo somente leitura;
- tipos de resposta e tipos normalizados para produto, variante, preço e estoque;
- mapeamento por identificadores estáveis (`externalId`/SKU), falhando fechado em
  conflitos;
- política comercial que mantém registros `QUOTE_ONLY` quando qualquer aprovação
  ou dado crítico está ausente;
- planejador de sincronização `dryRun: true` para `create`, `update`, `no-op` e
  `conflict`, sem escrita no banco.

As credenciais são lidas exclusivamente de `OMIE_API_URL`, `OMIE_APP_KEY` e
`OMIE_APP_SECRET`. Esses valores não são registrados, serializados em erros ou
expostos ao frontend. Os dois templates backend contêm apenas placeholders
vazios; nenhum `.env` real foi criado ou versionado nesta fase.

## Manifesto candidato

`docs/catalog/COMMERCIAL-CATALOG-MANIFEST.example.json` é somente um template:
possui zero produtos e nenhum preço, SKU, peso, estoque, imagem, fiscal ou
shipping inventado. `expectedProductCount: 5` representa apenas o escopo
comercial informado, não dados descobertos.

## Evidência de discovery

| Item | Resultado |
| --- | --- |
| Integration found | NO antes desta camada estrutural |
| Credentials available | NO |
| Read-only connectivity | NOT AVAILABLE |
| Products discovered | 0 |
| Medusa products before/after | 0 / 0 |
| Medusa variants before/after | 0 / 0 |
| Catalog import | NÃO EXECUTADO |

## Dados necessários para avançar

Para cada produto real, ainda são necessários: identificador Omie estável,
nome, SKU/variante, preço aprovado em BRL, quantidade e local de estoque,
categoria, imagem se aplicável, regras fiscais, shipping profile e aprovações
explícitas de produto/preço/estoque/fiscal/shipping. Sem isso o produto deve
permanecer `QUOTE_ONLY` ou fora de venda direta.

## Próxima ação

`B) PROVIDE OMIE CREDENTIALS` para executar discovery read-only, ou
`D) RESOLVE SOURCE-OF-TRUTH DECISION` se Omie não for a fonte operacional.

## Regressão executada

- Backend typecheck: PASS.
- Backend unit: PASS, 11 suítes e 64 testes.
- Backend HTTP integration: PASS, `health.spec.ts`, 2 testes.
- Backend lint: PASS, 0 errors e 35 warnings herdados.
- Storefront typecheck: PASS.
- Storefront lint: PASS, 0 errors e 77 warnings herdados.
- Storefront unit: PASS, 14 testes.
- Storefront build: PASS, client e SSR.
- `git diff --check`: PASS.
