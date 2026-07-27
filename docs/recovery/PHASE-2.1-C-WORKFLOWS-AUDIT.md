# Auditoria de Workflows (Subfase 2.1-C.2-A)

## 1. Inventário de Arquivos
- **Quantidade total de arquivos:** 21 arquivos em `apps/backend/src/workflows`
- **Workflows encontrados:** 14 (Corrigido após re-auditoria)
- **Steps individuais:** 23 execuções de `createStep` (incluindo isolados em `steps/` e `hooks/`, além de in-line)
- **Workflows órfãos:** 0 (Todos atendem endpoints ou scripts)
- **Testes existentes:** 0 arquivos de teste dedicados `*.spec.ts` dentro de `src/workflows`.

## 2. Mapa de Workflows

| Workflow | Arquivo | Entrada | Saída | Steps | Compensação | Módulos | Chamadores | Testes | Risco |
|----------|---------|---------|-------|-------|-------------|---------|------------|--------|-------|
| `acceptEmployeeInviteWorkflow` | `accept-employee-invite/index.ts` | Token/Pass | Result | 3 | Sim | `AUTH`, `CUSTOMER`, `COMPANY` | API Auth | Não | ALTO |
| `createCompanyAccountHolderWorkflow` | `create-company-account-holder/index.ts` | Input | `AccountHolder` | 2 | Sim | `PAYMENT`, `COMPANY` | API Payment | Não | CRÍTICO |
| `createCompanyWorkflow` | `create-company/index.ts` | Input | Objects | 4 | Sim | `CUSTOMER`, `COMPANY` | API Auth | Não | ALTO |
| `createRequestForQuoteWorkflow` | `create-request-for-quote.ts` | `cart_id`, `customer_id` | `Quote` | 4 | Parcial | `core-flows` | API Quote | Não | ALTO |
| `customerAcceptQuoteWorkflow` | `customer-accept-quote.ts` | Input | `Order` | Vários | ? | `core-flows` | API Quote | Não | CRÍTICO |
| `customerRejectQuoteWorkflow` | `customer-reject-quote.ts` | Input | `Order` | Vários | ? | `core-flows` | API Quote | Não | ALTO |
| `deleteCompanyWorkflow` | `delete-company/index.ts` | `{id}` | `undefined` | 1 | Sim | `COMPANY` | API Admin | Não | MÉDIO |
| `inviteEmployeeWorkflow` | `invite-employee/index.ts` | Input | Result | 3 | Sim | `COMPANY`, `AUTH` | API Admin | Não | ALTO |
| `merchantRejectQuoteWorkflow` | `merchant-reject-quote.ts` | Input | `Order` | Vários | ? | `core-flows` | API Admin | Não | ALTO |
| `merchantSendQuoteWorkflow` | `merchant-send-quote.ts` | Input | `Order` | Vários | ? | `core-flows` | API Admin | Não | ALTO |
| `reorderWorkflow` | `reorder.ts` | Input | `Cart` | Vários | Parcial | `core-flows` | API Store | Não | ALTO |
| `setupCompanyWorkflow` | `setup-company/index.ts` | Input | Objects | 4 | Sim | `AUTH`, `COMPANY` | API Setup | Não | ALTO |
| `setupCustomerWorkflow` | `setup-customer/index.ts` | Input | Objects | 2 | Sim | `AUTH`, `CUSTOMER`| API Setup | Não | ALTO |
| `updateCompanyWorkflow` | `update-company/index.ts` | Input | `Company` | 3 | Sim | `COMPANY`, `PAYMENT`| API Admin | Não | MÉDIO |

## 3. Classificação de Tipagem
- **`any` explícito:** 0
- **`as any`:** 11 ocorrências (presentes em casts de `link`, resoluções do `ContainerRegistrationKeys`, transformações de `carts[0].promotions` e loops de carrinho).
- **`as unknown as`:** 0
- **Supressões:** 5 ocorrências de `// @ts-ignore` nos workflows de Quote (provavelmente ignorando steps do core-flows).
- **Entradas sem Validação de Runtime:** A maioria usa tipos TypeScript nominais mas carece de Zod ou Type Guards estritos no início do Step.
- **Services com Cast Inseguro:** Várias chamadas fazem `as any` ou cast cego (ex: `as CompanyModuleService`) para módulos locais.

## 4. Classificação de Risco e Idempotência
- A maioria dos workflows opera sem chaves de idempotência transacionais declaradas no banco de dados. Compensações dependem da disponibilidade dos módulos em caso de falha.
- **Risco Crítico (2):** `createCompanyAccountHolderWorkflow`, `customerAcceptQuoteWorkflow`
- **Risco Alto (10):** Restante que muta ou aprova entidades secundárias complexas
- **Risco Médio (2):** `updateCompanyWorkflow`, `deleteCompanyWorkflow`
- **Risco Baixo (0):** Nenhum
- Nenhum dado sensível em Log foi detectado (tokens e senhas são mapeados direto para os módulos `AUTH` sem passar por loggers).

## 5. Primeiro Workflow Selecionado
- **Nome:** `deleteCompanyWorkflow`
- **Arquivo:** `apps/backend/src/workflows/delete-company/index.ts`
- **Domínio:** Empresas (Company)
- **Motivo da seleção:** É o workflow mais isolado e simples disponível. Contém apenas 1 step, possui compensação nativa clara (soft delete / restore), não toca no domínio financeiro, sem chamadas externas a provedores, não possui `any` no código, sendo o ponto de partida ideal para fixar o padrão de testes unitários e validações estritas exigidos sem estilhaçar a base de código.
- **Testes necessários:** Teste unitário para execução de sucesso e execução da compensação em caso de falha. Teste validando input vazio.
