# Auditoria do createAccountHolderStep (Subfase 2.1-C.2-C-B.2-A)

## Correção da Auditoria B.2-A.1
O documento inicial apresentava inferências soltas sobre dedup de providers, falhas totais versus falhas ambíguas, omissão na validação completa do container de medusa-config e tipagens irreais no Link e Query do Medusa. Abaixo constam as correções exatas baseadas em inspeção formal do Medusa V2, do repositório em branch atual e da CLI/Bash tools.

---

## 1. Identidade da auditoria
- **Base:** Commit `45dfbc683d17663a331a369ad8aa4f8489c790aa`
- **Componente auditado:** `createAccountHolderStep`

## 2. Escopo
Auditoria somente de leitura na etapa de criação do vinculador de pagamentos do `updateCompanyWorkflow`. Analisa fluxo atual, falhas arquiteturais, idempotência e testes necessários, servindo de roadmap para refatorações futuras (Subfases B.2-B em diante).

## 3. Arquivos analisados
- `apps/backend/src/workflows/update-company/index.ts`
- `apps/backend/src/utils/is-stripe-configured.ts`
- `apps/backend/src/utils/payment-availability.ts`
- `apps/backend/medusa-config.ts`
- `apps/backend/src/links/company-account-holder.ts`

## 4. Mapa dos Callers
O step avalia a transição `was_activated` baseada em `company.status === CompanyStatus.ACTIVE` e `company.previous_status !== CompanyStatus.ACTIVE`.
**Transições ativadoras reais suportadas pelo engine:**
- `PENDING` → `ACTIVE`
- `SUSPENDED` → `ACTIVE`
- `INACTIVE` → `ACTIVE`
*(Qualquer alteração pro ativa de status que não era active aciona o link builder).*

**Callers diretos do Workflow (rotas conectadas):**
- **Admin API:** `apps/backend/src/api/admin/companies/[id]/route.ts`
- **Storefront API:** `apps/backend/src/api/store/company/me/route.ts`

**Sem chamadas indiretas (outros workflows, subscribers, jobs) mapeadas na source-tree.** 

## 5. Disponibilidade do Provider e Payment 
**isStripeConfigured() verifica:** `!!process.env.STRIPE_API_KEY`
**getPaymentAvailability() verifica:** `process.env.PAYMENTS_ENABLED === "true"` e `process.env.PAYMENT_PROVIDER_ENABLED === "true"`.
**medusa-config (Registro Real) verifica:** O provider Stripe só é registrado no Array se `processingEnabled && process.env.STRIPE_API_KEY` foren truthy.

**Matriz Obrigatória de Validação de Provider:**
| API key | PAYMENTS_ENABLED | PAYMENT_PROVIDER_ENABLED | isStripeConfigured | Provider registrado | Resultado provável do step |
|---|---|---|---|---|---|
| Ausente | False | False | False | Não | `skipped: true` seguro |
| Presente | False | False | True | Não | Quebra: Provider Not Found |
| Presente | True | False | True | Não | Quebra: Provider Not Found |
| Presente | False | True | True | Não | Quebra: Provider Not Found |
| Presente | True | True | True | Sim | Sucesso / Executa lógicas |
| Placeholder ("...") | True | True | True | Sim | Falha Crítica no provider |
| Espaços (" ") | True | True | True | Sim | Falha Crítica no provider |

- `isStripeConfigured` prova que o provider foi registrado? **NÃO.**
- O step pode tentar usar provider inexistente? **SIM.** E isso estoura a execução do workflow.
- Empresa pode ficar ACTIVE sem Account Holder? **SIM**, se a key não estiver lá.
- Empresa pode ficar ACTIVE e o step falhar por provider não registrado? **NÃO**, porque a falha dentro do workflow desencadeia a compensação (e reverte `updateCompanyStep` se houver compensação mapeada pro `createAccountHolder` antes da falha, ou aborta sem retorno).
- Existe retry ou reconciliação oficial aqui? **NÃO.**

## 6. Provider ID
A string invocada é `pp_stripe_stripe`.
Este ID é a sintaxe de namespace estrito do `@medusajs/medusa/payment-stripe` quando injetado no config com o ID base `"stripe"`.
**Provider Correto:** Esse nome será correto apenas se ele for de fato o provedor habilitado na instância (que bate com `id: "stripe"` no `medusa-config`).
**Garantidamente Registrado:** `pp_stripe_stripe` não é garantido de estar registrado no momento em que o step dispara (vide Matriz Acima). Trocar por outro payment module fará esse Hardcode sempre falhar.

## 7. Recursos criados pelo Payment Module
A ordem real executada pelo SDK e confirmada por tipagem (`createAccountHolder(data, context)` e `link.create(...)`):
1. **Recurso Externo:** Chamada HTTP para API do Stripe que constrói o Customer Remote (Pode falhar, gerar sucesso ou Timeout Ambíguo).
2. **Account Holder Local (Payment Module DB):** Gravação da entidade nativa no Medusa linkada ao billing.
3. **Link DB:** Invocação do `link.create` (Módulo de ligação universal do DB central).
4. **Retorno ao Caller:** Somente no `StepResponse` retornado ao engine do SDK.

No cenário de Timeouts/Respostas ambíguas da requisição web, o Provider Externo *pode ter criado* o recurso, enquanto o registro Account Holder Local aborta a pipeline. Classificação: **Possível órfão de infraestrutura não controlado**.
Não se declara "nenhum recurso foi criado" em aborts abruptos de rede.

## 8. Semântica de Compensação do createStep e StepResponse
Comportamento Medusa v2 Workflows SDK `StepResponse`:
Se um handler rodando no `createStep` lança `Error` sem retorno, ele aciona rollback (aborta fluxo e roda compensação dos steps que já completaram). A compensação *deste* step atual não é notificada.
Para compensar dados parciais modificados em falhas internas do handler do próprio step, o retorno oficial do erro documentado pelo SDK deveria ser:
`return StepResponse.permanentFailure("motivo", compensationData)`
Mas o `createAccountHolderStep` não usa este wrapper.

**Cenário Real do step:**
Se `createAccountHolder` (criou Local + Provider externo) tem sucesso, mas `link.create` lança throw (falha banco de dados primário ou constraint link):
- A compensação *deste* step nunca recebe dados (ela falhou a etapa anterior a gerar o DTO).
- **Recurso externo pode ficar órfão?** SIM, Comprovado.
- **Account Holder local pode ficar órfão?** SIM, Comprovado.
- **Existe cleanup interno?** Não para o Workflow (requereria bloco catch que invocasse `.permanentFailure` ou desmanchasse manulamente).

## 9. Query - Tipo Oficial e Resultado
A invocação `query.graph()` que roda por debaixo do engine `ContainerRegistrationKeys.QUERY` exporta, na V2:
Tipo Base (RemoteQueryFunction): `RemoteQueryFunctionReturn<RemoteQueryInput<TEntry, TFields>>`.
Em inferência de query.graph customizada, a estrutura de resultado que as API tipicamente garantem são:
**Estrutura do resultado esperada:** `{ data: Array<any>, metadata: any }`.
Porém o retorno seguro recomendável pro Linker custom é:
`data: Array<{ id: string, account_holder?: { id: string } }>`
*Onde company é inferida implícita na busca, e account_holder o relation object se presente.*

## 10. Link - Cardinalidade e Unicidade
A definição em `company-account-holder.ts` é:
`defineLink(COMPANY_MODULE.linkable.company, Modules.PAYMENT.linkable.accountHolder)`
**Cardinalidade Defina:** 1:1.
Uma Company pode ter apenas um Account Holder e um Account Holder pode estar atrelado somente a uma Company nesta definição específica de Link Modules do Medusa SDK (diferente do Customer, não usa `isList`).
**Unicidade:** É tratada como Primary Constraint Database pela modelagem nativa do Module Builder de Link. 
Multi-provider demandaria chaves secundárias na tabela linkada.
**Link duplicado:** Falha dura de banco (`link.create` causará `UniqueConstraintViolation`).
**Delete Cascade:** O SDK do LinksModule costuma gerenciar deleções brandas de Soft Delete entre relações, porém o Account Holder Local necessita de remoção lógica individual do módulo de payments invocada como ação ativa em steps de cancelamento.

## 11. Idempotência e Concorrência
O provedor (Stripe SDK via Payment module) gera um `customer.id` com base nos contextos de payload enviados. Se ele não passar via `idempotencyKey` a criação da conta baseando-se no customer email, requisições duplicadas farão duplos customers Stripe com o mesmo email. O Payment Module nativo V2 Medusa sem key não deduplica via ID externo antes de injetar Local Entity.
**Cenário Concorrente Básico:**
- A e B consultam e acham `data: []` sem account_holder.
- A e B invocam criadores no provider. Dois customers gerados remotamente.
- A e B gravam Local Account Holder medusa base table (dois gerados).
- A e B tentam `link.create`.
- **Link A passa:** Link 1:1 estabelecido. 
- **Tentativa de Link B falha:** O LinkModule bloqueia vinculação secundária da mesma Company para Account Holder distinto (Constraint de Primary 1:1). 
- **Órfão B:** O recurso local Account Holder B e o remote Customer Stripe B nasceram orfãos no limbo e a exception não será limpa pois o step B lançará crash na engine.
*Cobrança de assinaturas descartada do relatório, o scope valida somente a orfandade de accounts nulas.*

## 12. Matriz Completa de Falhas

| Caso | Evento de Falha | Erro Propagado | Risco | Comportamento Comprovado | Recurso Externo | Account Holder Local | Link | Compensação deste Step | 
|---|---|---|---|---|---|---|---|---|
| A | Stripe key ausente | Não | Baixo | `skipped: true` | Zero | Zero | Zero | Não registrada |
| B | Key presente e flags false | Sim | Alto | Crash: Payment Not Found | Zero | Zero | Zero | Não registrada |
| C | payment resolve falha | Sim | Médio | Throws Engine | Zero | Zero | Zero | Não registrada |
| D | query resolve falha | Sim | Médio | Throws Engine | Zero | Zero | Zero | Não registrada |
| E | query.graph falha | Sim | Médio | Throws Engine | Zero | Zero | Zero | Não registrada |
| F | query retorna vazio | Não | - | Fluxo continua | Sim | Sim | Sim | Apta a rollback |
| G | query retorna company sem account_holder | Não | - | Fluxo continua | Sim | Sim | Sim | Apta a rollback |
| H | query retorna account_holder objeto | Não | Baixo | `skipped: true` | Zero | Zero | Zero | Não registrada |
| I | query retorna array inesperado (estrutura base) | Sim | Baixo | TypeError undefined prop | Zero | Zero | Zero | Não registrada |
| J | Account Holder já existe | Não | Baixo | `skipped: true` | Zero | Zero | Zero | Não registrada |
| K | createAccountHolder (LANÇA antes do Remote) | Sim | Médio | SDK aborta fluxo base | Zero | Zero | Zero | Não registrada |
| L | createAccountHolder (CRIA remote + FALHA local) | Sim | Crítico | **Remote Orfão provável** | Provável | Zero | Zero | Não registrada |
| M | createAccountHolder (Retorna) + link resolve FALHA | Sim | Crítico | Orfãos gerados | Sucesso | Sucesso | Zero | Não registrada |
| N | link.create FALHA | Sim | Crítico | **Local + Remote Orfãos** | Sucesso | Sucesso | Zero | Não registrada |
| O | link.create PASSA (workflow falha futuro) | Sim | - | Compensação normal executa | Sucesso | Sucesso | Sucesso | Executa rollback |
| P | compensation data inválida | - | Crítico | Compensação silenciosa / ignora | Persiste | Persiste | Persiste | Skipa ação |
| Q | link.dismiss FALHA (no rollback) | Sim | Crítico | Rolback interrompido | Persiste | Persiste | Destruído? (ambíguo) | Aborta meio |
| R | deleteAccountHolder FALHA | Sim | Crítico | Orfão preservado no módulo e DB | Persiste | Persiste | Deletado | Concluiu base |
| S | Account holder já removido | Sim/Não | - | Depende se a API DB é idemp. | - | - | - | Executa limpo |

## 13. Compensação e Ownership (Propriedade)
A compensação do step usa: `{ company_id, account_holder_id }`.
**Limitações Atuais:**
- Não discrimina se a conta foi gerada nesta execução (Se um fluxo for hackeado e mandar ID de account preexistente, a falha deletará a conta certa que a empresa possuía antes da requisição atuar).
- O `link.dismiss` ausente por quebra previne `deleteAccountHolder`, a conta local sobreviverá deslinkada da empresa, mas ativa para faturamento.
- O deleteAccountHolder ausente (se falhar em API) é falha dura de lixo no sistema, o link apagou e ninguém mais tem ponte para apagar o registro local/remoto da payment.
- Repetibilidade (Retry) não está tratada no workflow base. A compensação é vulnerável a não receber as informações do cleanup pendente.

## 14. Privacidade do E-mail e Logs
O `context.customer.email` trafegado injeta o `company_email` primário.
- **Dado Tratado:** É dado PII de contato.
- **Destino Real:** Payment Module e Third-Party Provider Stripe.
- **Necessidade de update:** Se o email da empresa for trocado nos paineis, não há linkagem descrita para propagar sync do email pro Remote Customer, descolando comunicações (não é risco imediato de crash, mas de business logic).

## 15. Resultado do Step
A base atual trafega `skipped: true` ao lado de `skipped: false` e campos mistos (ex: `account_holder_id: string` implícito opcional).
Os consumidores subsequentes reais do `createAccountHolderStep` = *Nenhum* (Ele é a step final da leaf que injeta infraestrutura, apenas devolve pra compensação e WorkflowResponse sem uso do payload interno pelo transform posterior).

## 16. Testes Existentes
Nenhum. A busca via the regex em `apps/backend/**/*.spec.ts` não detectou ocorrências testando diretamente `link.create`, `pp_stripe_stripe` ou asserts voltados a `createAccountHolder` isolado do módulo payments no coverage dos endpoints locais.

## 17. Matriz de Testes Futuros

| Nome do Caso | Tipo | Input / Setup | Comportamento Esperado | Recursos | Assertions / Risco |
|---|---|---|---|---|---|
| A. Type Guards | Unitário | Input incorreto/Vazio | Erro Invalid Data type | Nenhum | Previne Crash do provider ID |
| B. Stripe Ausente | Unitário | `STRIPE_API_KEY=""` | `skipped: true` | Zero | Sem account orfão criado |
| C. Provider Offline | Integração | Key presente, flags `false` | Fallback Try-Catch / Crash Seguro | Zero | Impede que modulo null tente link |
| D. Account Holder Existente | Integração | Grafo retorna Account Data | `skipped: true` | Preservado | Prevenir customer duplicates |
| E. Fluxo Feliz Criação | Integração | Novo company_id sem account | `skipped: false`, account_holder retornado | Criados | Link atado `COMPANY_MODULE` x `PAYMENT` |
| F. Link.create Fail (Idempotência/Orfandade) | Unitário/Int. | Forçar falha do `link.create` | `StepResponse.permanentFailure` devolve dados pro rollback agir | Deletados | Cleanup imediato para Account Holder |
| G. Rollback de Compensação | Unitário | Passar Snapshot Válido | link.dismiss rodando seguido de delete account holder | Limpos | Impede acúmulo e retenção lixo de Link |

## 18. Plano de Subfases (Restritivo)

- **B.2-B — Tipagem, contratos e guards:** Implementar Type Guards para a payload do CreateAccountHolder, discriminando a Return Union do passo sem permitir vazamentos.
- **B.2-C — Query e Link Tipados:** Ajeitar a resolução do `ContainerRegistrationKeys.QUERY` e `LINK` para interfaces declaradas de `RemoteQueryFunction` e `ILinkModule` removendo `any`.
- **B.2-D — Idempotência e Concorrência:** Adicionar checagem de transação/idempotência provida pelo engine se viável na tipagem base, avaliando necessidade explícita em requisições de customer_id duplicado no SDK do Stripe.
- **B.2-E — Falha parcial entre Account Holder e Link:** Implementar bloco de try/catch ao redor da execução do `link.create`. Caso estoure exceção, engatilhar `.permanentFailure()` com as compensation-data explícitas para garantir varredura orfã, ou forçar wipe manual do modulo de pagamentos local e lançar a exceção de novo.
- **B.2-F — Compensação, Cleanup e Ownership:** Reescrever step de cancelamento (`compensationData`) para garantir limpeza isolada tolerante a falhas (por ex., ignorar NotFound no Provider ao tentar deletar customer já deletado).
- **B.2-G — Testes Unitários:** Levantar a suíte spec isolando Mocks e testando todas as rotas (Bypass, Error link e Success creation) sem base remota.
- **B.2-H — Testes de Integração:** Checagem cruzada validando a query.graph devolvendo null contra container de banco ativo no coverage de workflow engine.

## 19. Classificação de Risco
- **Risco com Payment Desativado (STRIPE_API_KEY false):** BAIXO (`skipped: true`).
- **Risco Key Presente / Flags False (PROVIDER NOT REGISTERED):** MÉDIO (O step vai tentar resolver Payment Provider ou API do Stripe SDK e vai causar falha abrupta na Engine sem recursos orfãos perigosos criados na web, mas derrubando updates das companhias).
- **Risco Payment Totalmente Habilitado:** CRÍTICO. Devido às brechas de atomicidade na requisição HTTP externa com a base do Medusa relacional (Link constraint 1:1), interrupções criam orfandades graves financeiras locais e remotas.

## 20. Gates de Baseline (Estado Atual)
- `tsc --noEmit` (TypeScript): PASS (0 erros). Exit code 0.
- `eslint src/` (Lint): PASS. Exit code 0.
- `jest` (Unit): PASS. Executados 77 testes, 77 aprovados. 0 falhos (4 suítes: encryption, document, update-company, delete-company).
- `medusa build`: PASS. Projeto empacotado.

*(Nenhuma alteração nos arquivos base foi gerada, preservando a imutabilidade demandada da auditoria e do branch de verificação)*

## Subfase B.2-B — Tipagem, contratos e guards
- **Tipos criados:** `CreateAccountHolderInput`, `CreateAccountHolderStepResult`, `CreateAccountHolderCompensationData`.
- **Guards criados:** `isCreateAccountHolderInput`, `isCreateAccountHolderCompensationData`.
- **Builders criados:** `buildCreateAccountHolderInput`, `buildCreateAccountHolderCompensationData`.
- **Handlers extraídos:** `createAccountHolderStepHandler`, `createAccountHolderCompensationHandler`.
- **Comportamento preservado:** Todos fluxos felizes e returns antecipados (`skipped: true`) preservados intactos, com ordem igual de dismiss e deleção no Payment, com falhas passadas para o engine.
- **Quantidade de `any` antes:** 5 usos na Payment integration local do workflow.
- **Quantidade de `any` depois:** 4 (uma assinatura de compensationData any eliminada).
- **Ocorrências temporárias restantes:**
  - 1x `query as any`
  - 1x `existingLinks[0] as any`
  - 1x `link as any` (criação)
  - 1x `link as any` (dismiss)
- **Divergência das flags pendente:** Mantido preservado `isStripeConfigured`, sem injetar `PAYMENTS_ENABLED` ainda.
- **Pendências listadas:** Query e Link não corrigidos. Idempotência e concorrência não protegidos. permanentFailure não implementado. Compensação do account holder ainda vulnerável a falhas abruptas dependendo da order.
- **Testes realizados:** Suíte pura criada com 19 testes em `create-account-holder-contracts.unit.spec.ts` cobrindo builders puros com tipagem rigorosa estática.

## Subfase B.2-C — Tipagem segura da Query e do Link

- **Commits:** `0dadf29` (refactor) e `8e71266` (test).
- **Tipos importados:** `RemoteQueryFunction` e `LinkDefinition` de `@medusajs/framework/types` — ambos tipos oficiais do framework, sem `import type` fictício.
- **Interface declarada:** `RemoteLinkService { create(payload: LinkDefinition | LinkDefinition[]): Promise<unknown>; dismiss(...): Promise<unknown> }` — interface estrutural que descreve o objeto RemoteLink registrado em `ContainerRegistrationKeys.LINK`. Exportada para testabilidade.
- **Tipo declarado:** `CompanyAccountHolderGraphRecord { id?: string; account_holder?: { id: string } }` — tipo estrutural do registro retornado por `query.graph` para entidade `"company"` com fields `["account_holder.*"]`.
- **Adapter criado:** `getExistingAccountHolderId(data: unknown): string | null` — valida em runtime que `data` é array não-vazio, que `data[0]` é objeto, que `account_holder` é objeto, que `account_holder.id` é string não-vazia. Retorna o id ou null. Sem casts, sem any.
- **Builders criados:** `buildCompanyAccountHolderLinkPayload(companyId, accountHolderId): LinkDefinition` e `buildCompanyAccountHolderDismissPayload(companyId, accountHolderId): LinkDefinition` — retornam `LinkDefinition` tipada usando `COMPANY_MODULE` e `Modules.PAYMENT` como chaves.
- **Substituições realizadas:**
  - `container.resolve(ContainerRegistrationKeys.QUERY) as any` → `container.resolve<RemoteQueryFunction>(ContainerRegistrationKeys.QUERY)`
  - `(existingLinks[0] as any)?.account_holder` → `getExistingAccountHolderId(existingLinks)` com checagem `!== null`
  - `container.resolve(ContainerRegistrationKeys.LINK) as any` (criação) → `container.resolve<RemoteLinkService>(ContainerRegistrationKeys.LINK)`; payload via `buildCompanyAccountHolderLinkPayload`
  - `container.resolve(ContainerRegistrationKeys.LINK) as any` (dismiss) → `container.resolve<RemoteLinkService>(ContainerRegistrationKeys.LINK)`; payload via `buildCompanyAccountHolderDismissPayload`
- **Quantidade de `any` depois:** 0 em todo o bloco `createAccountHolderStep`.
- **Lógica preservada:** Nenhuma mudança de comportamento runtime. A checagem de `existingAccountHolder` (truthy) foi convertida para `existingAccountHolderId !== null` — semanticamente idêntica porque `getExistingAccountHolderId` retorna string não-vazia ou null.
- **Testes adicionados:** 19 novos testes em `create-account-holder-contracts.unit.spec.ts` cobrindo `getExistingAccountHolderId` (9 casos), `buildCompanyAccountHolderLinkPayload` (3 casos), `buildCompanyAccountHolderDismissPayload` (3 casos), integração dos handlers com payloads tipados (4 casos). Total da suíte: 38 testes.
- **Gates:** TypeScript `--noEmit` exit 0, ESLint exit 0, Jest 191 unit tests aprovados em 15 suítes (health.spec.ts excluído por requer `TEST_DATABASE_URL`), build completo via `medusa build`.
- **Pendências mapeadas:** Idempotência e concorrência não protegidas. `permanentFailure` não implementado. Compensação ainda vulnerável a falha entre `link.dismiss` e `deleteAccountHolder`. Provider ID hardcoded. Divergência entre `isStripeConfigured` e flags de habilitação de payment.

- **Gates Reais do repósitorio:** Linter passou sem erros, unitários somaram 172 aprovados em 15 suítes na infra real via script cross-env, compilador validou todos os tipos exportados com 0 warnings, e build finalizado.
