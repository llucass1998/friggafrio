# Baseline dos Gates — Fase 2 (TypeScript, ESLint e Build)

Esta baseline foi gerada no início da Fase 2 para registrar os warnings presentes no ambiente estático. Não foram detectados erros de falha de comando (exit code != 0).

## Sumário de Comandos

| Comando | Duração Estimada | Exit Code | Erros | Warnings |
|---------|------------------|-----------|-------|----------|
| `backend build` | ~15s | 0 | 0 | 11 |
| `backend typecheck` | ~5s | 0 | 0 | 0 |
| `backend lint` | ~5s | 0 | 0 | 11 |
| `backend test:unit` | 10.9s | 0 | 0 | 0 |
| `storefront typecheck`| ~3s | 0 | 0 | 0 |
| `storefront lint` | ~5s | 0 | 0 | 7 |
| `storefront test:unit`| 0.16s | 0 | 0 | 0 |
| `storefront build` | ~20s | 0 | 0 | 0 |

## Problemas Detectados

| ID | Aplicação | Arquivo | Linha | Categoria | Erro | Causa | Correção Planejada |
|----|-----------|---------|-------|-----------|------|-------|--------------------|
| 1 | Storefront | ProductShowcaseCarousel.tsx | 78:39 | Tipagem | Warning: Unexpected any | Uso explícito de `any` em ref | Substituir pelo tipo correto do Radix/React. |
| 2 | Storefront | AccessibilityPanel.tsx | 33:29 | Tipagem | Warning: Unexpected any | `any` inserido na prop | Criar interface tipada estrita. |
| 3 | Storefront | AccessibilityProvider.tsx | 38:24 | Tipagem | Warning: Unexpected any | Uso de `any` solto | Substituir por tipo do contexto/estado. |
| 4 | Storefront | AccessibilityProvider.tsx | 74:6, 94:6 | React Hooks | Missing dependency | `cancelSpeech` ausente do deps | Incluir no array de dependência (memoizar a func se preciso). |
| 5 | Storefront | AccessibilityProvider.tsx | 136:17 | React Refresh | Fast refresh only works when a file only exports components | Export não comp. no provider | Extrair types/constantes para arquivo separado. |
| 6 | Storefront | LiveRegion.tsx | 6:17 | React Refresh | Fast refresh only works when a file only exports components | Export solto | Remover/isolar export. |
| 7 | Backend | medusa-config.ts | 12:9, 16:9 | API Medusa | Use MedusaError | Disparo de `new Error` genérico | Substituir por import e call do `MedusaError`. |
| 8 | Backend | addresses/[id]/route.ts | Múltiplas | API Medusa | Avoid calling service in API route | Call direta ao invés de usar Workflow | Dívida técnica do Backend (avaliar bloqueio na Etapa 9). |
| 9 | Backend | addresses/route.ts | Múltiplas | API Medusa | Avoid calling service in API route | Call direta | Dívida técnica do Backend. |

A baseline confirma que os portões de compilação não estão com erros críticos impeditivos, o foco será refinar o ESLint e limpar os Warnings e _any_ soltos do repositório, garantindo comportamento fail-closed nos componentes.
- Storefront TypeScript is fully clean with `tsc --noEmit` passing (0 errors).
- Backend TypeScript is fully clean with `tsc --noEmit` passing (0 errors).
- Storefront ESLint and Backend ESLint are fully clean (0 warnings, 0 errors).
- Build processes successful. Vite bundles SSR and Medusa transpiles successfully.
- Test suites run reliably. Unit tests in backend (34/34) pass successfully.
