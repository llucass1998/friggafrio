# FriggaFrio — Recovery Baseline

Data da fotografia: 2026-07-26 01:10:35 -03:00
Responsável técnico: IDE Agent
Branch: `main`
Commit: `e576de2 fix(storefront): Complete refactor and finalization for production MVP`

## Objetivo

Congelar a evidência inicial da recuperação antes de qualquer correção de código. Este
documento não afirma que o sistema está operacional. A decisão inicial é:

> **SISTEMA NÃO LIBERADO PARA VENDA REAL**

## Estado inicial confirmado

| Área | Evidência inicial | Estado |
|---|---|---|
| Git | 4 arquivos rastreados modificados, nenhum staged/deletado, 136 não rastreados | Crítico |
| Backend | build previamente reprovado; unitários existentes majoritariamente mockados | Reprovado |
| Storefront | bundle gerável, porém TypeScript e E2E previamente reprovados | Reprovado |
| Pagamentos | endpoint arbitrário e providers não homologados identificados na auditoria | Crítico |
| Banco | divergências potenciais entre models, workflows e migrations | Pendente |
| Produção | staging, backup, restore, rollback e observabilidade não homologados | Pendente |
| Fiscal | depende de dados e validação profissional | Bloqueado externamente |

## Ambiente

| Item | Valor observado |
|---|---|
| Sistema | Windows / PowerShell |
| Node | `v24.15.0` |
| pnpm ativo | `9.4.0` |
| pnpm declarado no projeto | `10.12.3` |
| Workspace raiz | `ai-template@1.0.0` |
| Backend | `backend@0.0.1` |
| Storefront | `storefront` |
| Medusa | `2.18.0` |

A diferença entre o pnpm ativo e o declarado é um risco de reprodutibilidade e será
tratada na recuperação de Git/CI. Nenhuma dependência foi alterada durante a fotografia.

## Regras preservadas

- Nenhum pagamento real será executado.
- Nenhum preço, estoque, SKU ou dado fiscal será inventado.
- Banco e volumes não serão apagados.
- Alterações preexistentes do usuário serão preservadas.
- Segredos, cookies, tokens, senhas e documentos pessoais não serão impressos.
- Fases dependentes de credenciais ou homologação externa serão marcadas como bloqueadas.
- `PAYMENTS_ENABLED=false` e `PAYMENT_PROVIDER_ENABLED=false` são os padrões de segurança
  requeridos até a aprovação integral dos gates.

## Evidência relacionada

- Baseline detalhado do Git: `docs/audit/GIT-BASELINE.md`
- Checklist: `docs/audit/FRIGGAFRIO-RECOVERY-MASTER-CHECKLIST.md`
- Relatório evolutivo: `docs/audit/FRIGGAFRIO-RECOVERY-FINAL-REPORT.md`
