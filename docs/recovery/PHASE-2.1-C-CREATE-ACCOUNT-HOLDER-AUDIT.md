# Auditoria do createAccountHolderStep (Subfase 2.1-C.2-C-B.2-A)

## 1. Identidade da auditoria
- **Base:** Commit `7ffac502a545d37347abde177d9ee9878b65cc8b`
- **Componente auditado:** `createAccountHolderStep`

## 2. Escopo
Auditoria somente de leitura na etapa de criação do vinculador de pagamentos do `updateCompanyWorkflow`. Analisa fluxo atual, falhas arquiteturais, idempotência e ausência de testes, pavimentando roteiro para correções posteriores.

## 3. Arquivos analisados
- `apps/backend/src/workflows/update-company/index.ts`
- `apps/backend/src/utils/is-stripe-configured.ts`
- `apps/backend/medusa-config.ts`
- `apps/backend/src/links/company-account-holder.ts`

## 4. Callers
Apenas engatado no final do `updateCompanyWorkflow` atrelado condicionalmente pela validação do transform/when que checa se a empresa mudou o estado especificamente de `PENDING/SUSPENDED` para `ACTIVE`.

## 5. Fluxo atual
1. **Recebe:** `company_id` e `company_email`.
2. **Verifica:** `isStripeConfigured()`.
3. **Quando Stripe não está configurado:** retorna `StepResponse({ skipped: true }, null)`.
4. **Resolve:** `Modules.PAYMENT` (Módulo central Medusa Payment).
5. **Resolve:** `ContainerRegistrationKeys.QUERY`.
6. **Consulta:** Executa query via graph: `entity "company"`, `fields ["account_holder.*"]`, `filters { id: input.company_id }`.
7. **Verifica primeiro resultado:** Lê `existingLinks[0]`.
8. **Quando existe Account Holder:** Retorna `StepResponse({ skipped: true }, null)`.
9. **Cria Account Holder:** Com `provider_id: "pp_stripe_stripe"`, injetando customer context.
10. **Cria link:** Resolve LINK e vincula `COMPANY_MODULE` ao novo account holder.
11. **Retorna:** `StepResponse` informando `skipped: false` com DTO contendo compensação.
12. **Na compensação:** Desfaz (dismiss) do link, seguido de `deleteAccountHolder`.

## 6. Input
O input inferido contém `{ company_id: string; company_email: string }`. **Não possui Guard Runtime**. Embora declarado no TypeScript (`input: { ... }`), o passo cega confia no engine para orquestrar esses tipos que vêm do step anterior (transform mapping). Null, vazio ou string vazias nos campos seriam barrados pela interface TS no momento da compilação se passados diretamente, mas inputs inválidos que venham de mapeamentos upstream dinâmicos quebrarem o query graph e subsequentemente a criação na API do Stripe.

## 7. Stripe configuration e Guard
A função `isStripeConfigured` verifica apenas a presença simples (boolean) de `process.env.STRIPE_API_KEY`. Se `STRIPE_API_KEY` for removida (por ex., no ambiente de Dev/Test), o passo do workflow sofre short-circuit (`skipped: true`). 
- **Empresa pode ficar ACTIVE sem account_holder:** Sim.
- **Isso é um risco técnico ou decisão de negócio?** Configura-se como decisão deliberada de negócio pendente de fluxo alternativo; um contorno para contornar falhas duras quando payment keys estão indisponíveis localmente. Porém, não há engine de retry formal em backend (se desativado agora, quando for reativado, precisará de uma API externa para trigger da ativação, ou a empresa ficará orfã de payments).

## 8. Provider ID
O provedor registrado hardcoded é `pp_stripe_stripe`. Este identificador está acoplado ao `medusa-config.ts` injetando `@medusajs/medusa/payment-stripe`. O fato de ser hardcoded restringe a modularidade; se trocarmos o plugin do Stripe por Adyen ou PagSeguro, esse step quebrará invariavelmente.
*Recomendação para futura correção*: Derivar a constante ou capturá-la no Payment Module por padrão.

## 9. Query Module
O `ContainerRegistrationKeys.QUERY` usa como underlying o Graph do Medusa v2 (`RemoteQueryFunction`). Retorna por padrão `{ data: Array<any>, metadata: any }`. Se a base estiver vazia, `data` vem `[]`.
O acesso cego a `existingLinks[0]` como array indexado funciona no JS mesmo em array vazio (`undefined`), que o Optional Chaining suporta.

## 10. Link Module
A definição localiza-se em `apps/backend/src/links/company-account-holder.ts` via `defineLink`. As chaves baseiam-se em `[COMPANY_MODULE]` e `[Modules.PAYMENT]`. A cardinalidade via defineLink é standard, mas por uso é tratada conceitualmente como 1:1.

## 11. Concorrência e Idempotência
**Concorrência:** Não está protegida. Múltiplas execuções no mesmo milissegundo passariam as checagens do Graph como `null`, instanciariam *n* Customers no provedor da Stripe e fariam a vinculação Linker (que pode falhar em duplicação se DB tiver constraint strict). 
**Idempotência:** A consulta por si só não garante que o Stripe fará deduplicação de "customer". Sem idempotency key para criação e falta de travamento (Locks DB) na leitura, um cenário de race-condition gerará Customers órfãos sem Links e cobrará assinaturas duplicadas se existirem no futuro. (Classificação: **NÃO COMPROVADA**).

## 12. Matriz de falhas
- **A. Stripe desativado:** Resulta early return `skipped: true`. Seguro.
- **B. Resolve PAYMENT falha:** Error thrown. Compensação do Step NÃO é registrada porque falhou *antes* do StepResponse instanciar o link. Nenhum lixo (Orfão) criado. Seguro.
- **C. Resolve QUERY falha:** Idem. Seguro.
- **D. query.graph falha:** Idem. Seguro.
- **E. query retorna vazio:** Segue o fluxo normal. Seguro.
- **F. Account Holder já existe:** Resulta early return `skipped: true`. Seguro.
- **G. createAccountHolder falha:** O SDK do Stripe devolve Error. StepResponse não retorna, a compensação não atua, nenhum account foi criado. Seguro.
- **H. createAccountHolder tem sucesso, link.create falha:** **PERIGO ALTO**. O Customer foi criado no Stripe (gerando billing id), mas falhou a associação no Link local do Medusa. O step estourou *antes* de devolver um `StepResponse`. Em Medusa v2, compensações são disparadas somente com a devolução formal da Data, ou pelo `compensationData` retornado em fail hooks do container (o que não existe aqui). **O Account Holder ficará órfão no Stripe**.
- **I. link.create tem sucesso:** `StepResponse` devolvido. A partir daqui, falhas em steps futuros rodam compensação corretamente. Seguro.

## 13. Semântica do createStep
Foi comprovado por documentação base que: Se uma função em step engatilhar uma Exceção Crítica antes que um bloco emita um Result Object com os dados da compensação explícitos (e sem rollback actions isoladas no try/catch interno), a função de Compensação não terá dados injetáveis de estado de transição isolado deste fluxo. No cenário de erro no `link.create`, Account Holder fatalmente ficará orfão.

## 14. Auditoria de Compensação
A ordem de rollback:
1. `link.dismiss(...)`
2. `paymentModuleService.deleteAccountHolder(...)`

**Risco:** Se `link.dismiss()` falhar (e.g. timeout na infra do banco primário), o deleteAccountHolder não será invocado (porque a exceção escapará o Handler). A consequência é o accountHolder do Stripe não ser destruído.
Embora inverter (deletar Customer antes e Dismiss do DB local depois) solucione a falta da exclusão remota, a falha do Dismiss subsequente também causaria um link pendente no Medusa para um Customer apagado — corrompendo queries posteriores (retornaria null relations e falharia lógicas). 

## 15. Ownership
O `compensationData` injeta `{ company_id: input.company_id, account_holder_id: accountHolder.id }`.
Nesse setup, se um passo anterior ao Delete falhar ou se houver reuso indevido, a exclusão atuará cegamente baseada nesse ID. O risco realçado é puramente a falta de retry se as promises sequenciais não forem aglutinadas num executor persistente (como um saga pattern ou Promise.allSettled).

## 16. Resultados e Tipos
O tipo atual do output intercala branches com: `{ skipped: true }` sem propriedades account_holder_id versus `{ skipped: false, account_holder_id: string }`. Faltam Discriminated Unions e Cast para impedir que Consumers subsequentes batam num field indefinido.

## 17. Testes existentes
*Nenhum*. O diretório `update-company/__tests__` testa 100% da cobertura nos builders isolados e dos handlers de empresa (`updateCompanyStepHandler`), mas o Payment module step em si foi completamente segregado de invocações (as injeções de mocks ignoraram esse container linkável). 
Não constam suítes testando fluxo stripe no escopo primário do workflow, nem falsos mocks da graph db.

## 18. Matriz de testes recomendados (Gaps)
1. **Guard de Input:** Mocks unitários para `{ company_id, company_email }` e ausência deles.
2. **Stripe Desativado:** Assert para early return de Skipped.
3. **Query existente:** Assert do Graph DB barrando dupla criação.
4. **Criação Normal:** Verificação do `createAccountHolder` e `link.create` chamados com parâmetros corretos.
5. **Falha de Link (Account Orfão):** Validar comportamento em simulação de retry (try-catch) que chame exclusão limpa do Stripe se Link falhar.
6. **Compensação:** Simular sucesso e falha nos `dismiss` e `deleteAccountHolder`. 

## 19. Tipagens Inseguras 
Total remanescente no core do `updateCompanyWorkflow`: **5**
A. `query as any`
B. `existingLinks[0] as any`
C. `link as any` (criação)
D. `compensationData: any`
E. `link as any` (dismiss)

## 20. Decisões de negócio pendentes
- O que fazer se `STRIPE_API_KEY` for configurada muito tempo após a empresa já estar `ACTIVE`?

## 21. Plano de correção futura
B.2-B — Tipagem e guards do `createAccountHolderStep`.
B.2-C — Adapters tipados para Query e Link (removendo `any`).
B.2-E — Tratamento de falha atômica local com try/catch entre `createAccountHolder` e `link.create` (prevenindo órfão no remote provider).
B.2-F — Compensação robusta de dismiss vs provider delete.
B.2-G — Cobertura Unitária global dos branches.

## 22. Classificação de Risco
- **RISCO CRÍTICO**: Falta proteção de atomicidade distribuída (two-phase commit/saga emulation local) entre o Provider e o Graph de Links do Banco. Uma interrupção entre a requisição para Stripe e o Commit no Banco Medusa corrompe a estabilidade financeira e deixa tokens orfãos.
