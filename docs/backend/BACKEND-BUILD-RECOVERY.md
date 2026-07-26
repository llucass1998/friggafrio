# FriggaFrio — Recuperação do build backend

Data da validação: 2026-07-26
Workspace: `backend`
Estado: aprovado com advertências catalogadas

## Causa raiz removida

O bloqueio do TypeScript e do build estava em
`src/scripts/repair-friggafrio-sellable-catalog.ts`. O script aceitava container sem
tipo, criava produtos/SKUs/preços fictícios e aplicava alterações por padrão.

O reparo agora:

- usa tipos reais do Medusa e valida a resposta da query;
- executa em `dry-run` por padrão;
- exige o modo explícito `apply` para persistir;
- nunca cria produto, SKU ou preço;
- mantém produto não homologado como rascunho, oculto e com compra desabilitada;
- limita o escopo aos cinco gases autorizados;
- produz o mesmo plano em execuções repetidas, portanto é idempotente.

## Gates executados

| Gate | Resultado |
|---|---|
| `pnpm --filter backend typecheck` | Aprovado, 0 erro |
| `pnpm --filter backend test:unit` | 6 suites e 20 testes aprovados |
| `pnpm --filter backend build` | Aprovado |
| `medusa exec ... dry-run` — execução 1 | 97 lidos, 97 atualizações planejadas, 0 escrita |
| `medusa exec ... dry-run` — execução 2 | Resultado idêntico, 0 escrita |

O CLI Medusa 2.18 rejeita opções desconhecidas antes de encaminhá-las ao script. Por
isso, os modos são argumentos posicionais (`dry-run` e `apply`); o parser interno
também reconhece `--dry-run` e `--apply` caso o executor passe essas opções diretamente.

## Advertências do lint

O build concluiu com **0 erros e 77 warnings**. Nenhuma advertência foi ocultada.

| Regra | Quantidade | Classificação |
|---|---:|---|
| `prices-in-major-units` | 39 | P0 antes de executar scripts/migration de preço; risco comercial |
| `no-service-mutations-in-api-route` | 13 | P1; mover mutações de rotas para workflows |
| `use-medusa-error-not-generic-error` | 11 | P1; padronizar status e mensagens HTTP |
| `prefer-container-registration-keys` | 8 | P2; substituir strings mágicas |
| `prefer-link-over-remote-link` | 3 | P1; remover API depreciada |
| `zod-import-source` | 2 | P2; alinhar import ao framework |
| `step-id-kebab-case` | 1 | P2; alinhar ID e nome do step |

Os 39 alertas de unidade monetária permanecem bloqueadores para execução dos scripts
afetados. Eles não impedem compilar o servidor, mas nenhum script com esses alertas
deve ser usado em produção até os valores serem validados com fonte comercial real.

## Evidência de segurança do catálogo

As duas execuções dry-run retornaram:

```text
mode=dry-run
products=97 updates=97 missing_authorized=0
dry-run complete; no product or database state was changed
```

O teste estático impede a reintrodução de `createProducts`, valores de `amount`, SKUs
inventados e `purchase_enabled: true` no script de reparo.
