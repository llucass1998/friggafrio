# Pipeline de CI do FriggaFrio

Última validação local: 2026-07-26 02:05 -03:00
Responsável: IDE Agent
Estado da fase: **REPROVADA**

## Objetivo e política

O workflow `.github/workflows/ci.yml` é o gate obrigatório para `pull_request`,
push em `main`/`develop` e execução manual. Todos os jobs obrigatórios falham de
forma fechada: não há `continue-on-error`, `|| true` ou supressão de exit code.

Versões de execução:

- Node.js 20;
- pnpm 10.12.3, igual ao `packageManager` do repositório;
- instalação com `pnpm install --frozen-lockfile`;
- PostgreSQL 16 e Redis 7 nos jobs que exercitam servidor e banco;
- pagamentos e provider de pagamento explicitamente desabilitados.

## Grafo dos jobs

| Job           | Dependência                            | Gate                                                             |
| ------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `quality`     | nenhuma                                | install congelado, artefatos proibidos e sintaxe/formatação YAML |
| `backend`     | `quality`                              | build/geração de tipos, TypeScript, lint e unitários             |
| `storefront`  | `quality`                              | lint, TypeScript, unitários e build client/SSR                   |
| `integration` | `quality`                              | banco vazio, repetição idempotente e integração HTTP             |
| `e2e`         | `backend`, `storefront`, `integration` | Chromium, backend saudável e Playwright                          |
| `security`    | nenhuma                                | histórico Git completo e Gitleaks com relatório redigido         |

Relatórios são enviados somente em falha e retidos por sete dias. O job de
segurança usa `fetch-depth: 0`; analisar apenas o último commit esconderia o JWT já
identificado no histórico.

## Ordem específica do backend

O build vem antes do typecheck porque `medusa build` gera declarações dos módulos
customizados. Essa ordem foi comprovada em snapshot limpo na Fase 5.

As migrations do CI usam:

```text
medusa db:migrate --all-or-nothing --execute-safe-links
```

A primeira execução revelou scripts antigos que criavam catálogo, preço e estoque
não homologados. Na Fase 7, seis scripts foram retirados do caminho executável e
preservados somente em quarentena local ignorada. O CI agora executa o ciclo completo
e `assert-no-commercial-seed.mjs` reprova se uma migration inserir produto, variante,
preço ou inventário.

## Proteção contra artefatos indevidos

`scripts/ci/check-forbidden-artifacts.mjs` consulta somente arquivos rastreados e
reprova o job ao encontrar:

- tokens e arquivos `.env` indevidos;
- logs;
- builds e caches;
- resultados e relatórios gerados de Playwright;
- dumps, patches e artefatos temporários.

O teste local aprovou 729 arquivos rastreados após remover os artefatos antigos da
árvore versionável. O script informa apenas caminhos, nunca conteúdos.

## Evidências locais

| Verificação                                                  | Resultado                                                                  |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| Parse/formatação de `.github/workflows/ci.yml` pelo Prettier | aprovado                                                                   |
| Busca por `continue-on-error`                                | nenhum uso                                                                 |
| Falha proposital com exit code 23                            | propagada como 23; alteração não foi persistida                            |
| Guard de artefatos rastreados                                | aprovado, 729 arquivos                                                     |
| Backend build                                                | aprovado, 0 erros e 76 warnings                                            |
| Backend TypeScript                                           | aprovado, 0 erro                                                           |
| Backend unitários                                            | 6 suítes e 21 testes aprovados                                             |
| Integração HTTP Medusa/PostgreSQL                            | 1 suíte e 1 teste aprovados                                                |
| Migration de schema em banco vazio isolado                   | aprovada                                                                   |
| Segunda migration no mesmo schema                            | aprovada, banco já atualizado                                              |
| Remoção do banco temporário                                  | aprovada                                                                   |
| Storefront TypeScript                                        | aprovado, 0 erro                                                           |
| Storefront unitários                                         | 2 testes aprovados                                                         |
| Storefront build client/SSR                                  | aprovado                                                                   |
| Storefront lint                                              | **reprovado: 527 erros e 94 warnings**                                     |
| Navegador manual                                             | bloqueado: nenhuma instância do navegador da IDE disponível                |
| Scan do histórico                                            | bloqueante conhecido: JWT histórico aguarda revogação e limpeza coordenada |

O `actionlint` não está instalado no ambiente local. O YAML foi parseado pelo
Prettier e os comandos foram executados diretamente, mas a execução real no runner
GitHub só poderá ser observada após commit/push autorizado.

## Causa do estado reprovado

O pipeline está implementado para reprovar corretamente. Ele não pode ser
classificado como verde enquanto:

1. o lint do storefront retornar 527 erros;
2. o JWT permanecer no histórico Git;
3. o Playwright não tiver sido recuperado e executado no runner;
4. o E2E ainda não tiver fixtures comerciais reais e aprovadas.

Não se deve afrouxar nenhum gate para contornar esses itens.

## Operação

Antes de abrir PR:

```text
pnpm install --frozen-lockfile
node scripts/ci/check-forbidden-artifacts.mjs
pnpm --filter backend build
pnpm --filter backend typecheck
pnpm --filter backend lint
pnpm --filter backend test:unit
pnpm --filter storefront lint
pnpm --filter storefront typecheck
pnpm --filter storefront test:unit
pnpm --filter storefront build
```

Para integração, `TEST_DATABASE_URL` deve apontar para PostgreSQL isolado e conter
host, usuário e senha. O setup deriva `DB_HOST`, `DB_PORT`, `DB_USERNAME` e
`DB_PASSWORD` sem registrar seus valores. Banco de produção nunca deve ser usado.

## Recuperação

- Corrigir primeiro o lint do storefront; não usar `--no-error-on-unmatched-pattern`
  nem desabilitar regras.
- Revogar o JWT antes de qualquer reescrita coordenada do histórico.
- Manter migrations estruturais separadas de dados comerciais e nunca reintroduzir
  os scripts em quarentena.
- Na Fase 30, prover fixtures determinísticas e tornar o E2E verde.
- Somente então repetir todos os jobs e atualizar este estado.
