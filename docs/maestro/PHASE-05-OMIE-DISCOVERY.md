# Fase 5 — Omie Discovery (read-only)

## Gate 5 final evidence (2026-08-12)

- Security authorization: PASS. The local backend `.env` is ignored and untracked;
  the current Omie credentials were not found in tracked content, diffs, client
  bundles, or Git history. The historical JWT at `e576de2` is retained as the
  non-blocking `HISTORICAL_EXPIRED_SECRET` warning after confirming expiration,
  absence of an associated refresh credential, and expiration enforcement.
- Omie authentication and read-only `ListarProdutos`: PASS. Omie writes: `0`.
- Discovery: 13/13 pages, 1,229 records. The sanitised candidate manifest
  records 1,080 active catalog candidates and 149 inactive records skipped.
- First dry run/import: `CREATE 1080`, `UPDATE 0`, `NO_OP 0`, `CONFLICT 0`,
  `SKIP 149`; import created 1,080 Medusa products.
- Storefront projection: all 1,080 real products are visible through the Store
  API as `QUOTE_ONLY`, with purchase disabled, zero observed stock, and no
  implicit backorder.
- Second sync: `CREATE 0`, `UPDATE 0`, `NO_OP 1080`, `CONFLICT 0`, `SKIP 149`.
  Duplicate products, variants, SKU mappings, and inventory relations: `0`.
- Storefront: Store API only; no direct Omie browser calls. `QUOTE_ONLY` and
  `price_pending` metadata propagate to Product Card and PDP without showing a
  fake price or enabling Add to Cart.
- Gate 5 result: PASS. The preparation notes below are retained as chronology.

## State before final homologation

- Gate 4 permanece PASS no commit `c014d1524aa02adb3259148fea1067a92760451c`.
- Omie não estava implementada no repositório auditado.
- Nenhuma credencial Omie está disponível no ambiente local (`OMIE_ENV_NAMES=NONE`).
- Nenhuma chamada Omie foi executada e nenhum dado foi gravado no Medusa.
- Gate 5 permanece bloqueado até existir fonte comercial real e aprovada.

## Preparação automática do ambiente

- Arquivo local utilizado pelo Medusa: `apps/backend/.env`.
- `git check-ignore`: PASS; o arquivo é ignorado por `apps/backend/.gitignore`.
- `OMIE_API_URL`: PRESENT, endpoint oficial confirmado com HTTP 200 sem autenticação.
- `OMIE_APP_KEY`: MISSING.
- `OMIE_APP_SECRET`: MISSING.
- `loadEnv('development', process.cwd())`: confirmou o mesmo estado no processo Medusa.
- Nenhum valor secreto foi impresso, copiado para logs ou incluído no diff.

O endpoint configurado é `https://app.omie.com.br/api/v1/geral/produtos/`. As
credenciais permanecem vazias porque não foram encontradas em Process/User/
Machine environment, `.env*` locais, Docker ou arquivos do projeto.

## Fonte de verdade

A decisão de negócio foi registrada: o modelo é híbrido com a Omie como fonte
operacional e o Medusa como projeção ecommerce.

| Domínio | Fonte oficial | Contrato |
| --- | --- | --- |
| SKU e identificadores operacionais | Omie | Integração preserva o valor Omie e usa matching por identificador estável. |
| Preço | Omie | Nenhuma margem, conversão ou preço de pesquisa pode ser aplicado pela integração. |
| Estoque, quantidade e status operacional | Omie | Produto sem estoque confirmado não se torna vendável automaticamente. |
| Handle, SEO, categoria e imagens | Medusa | Enriquecimento próprio da projeção ecommerce. |
| Shipping, metadata e sellability | Medusa | Regras de publicação da loja; não podem fabricar preço ou estoque Omie. |
| Storefront | Medusa | Nunca acessa a Omie diretamente. |

Assim, a direção oficial permanece `Omie -> integration layer -> Medusa ->
Storefront`. A integração futura não deve sobrescrever campos operacionais da
Omie com dados do Medusa; conflitos devem falhar fechado e alterações de
shipping/fiscal/sellability exigem aprovação explícita.

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

Como `OMIE_APP_KEY` e `OMIE_APP_SECRET` estão ausentes, a operação
`ListarProdutos` não foi disparada. Não houve paginação, retry, 429 ou falha de
contrato para registrar.

## Dados necessários para avançar

Para cada produto real, ainda são necessários: identificador Omie estável,
nome, SKU/variante, preço aprovado em BRL, quantidade e local de estoque,
categoria, imagem se aplicável, regras fiscais, shipping profile e aprovações
explícitas de produto/preço/estoque/fiscal/shipping. Sem isso o produto deve
permanecer `QUOTE_ONLY` ou fora de venda direta.

## Próxima ação

`SECURE OMIE CREDENTIAL REQUIRED`: provisionar as duas credenciais externas,
sem alterar o código ou inserir valores no repositório. Depois disso o Maestro
executará `ListarProdutos`, gerará o manifesto candidato real e parará para
aprovação humana.

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
