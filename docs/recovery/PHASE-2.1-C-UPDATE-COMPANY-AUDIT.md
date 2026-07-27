# Auditoria de updateCompanyWorkflow (Subfase 2.1-C.2-C-A)

## 1. Resumo
Auditoria isolada de leitura para o `updateCompanyWorkflow`. O workflow processa atualizações de empresas e cria condicionalmente um `account_holder` no provider de pagamentos (Stripe) quando a empresa transiciona para o status "active". Identificamos múltiplos casts de type inseguros (any), dependências em módulos não validados em tempo de execução, compensações parciais (perda do link ao recuperar falhas) e concorrência sem bloqueio transacional (idempotência frágil). 

## 2. Arquivos auditados
- `apps/backend/src/workflows/update-company/index.ts`
- `apps/backend/src/utils/is-stripe-configured.ts`
- Tipagens internas do `@medusajs/framework/types` e `@medusajs/types` (`ILinkModule`, `RemoteQueryFunction`).

## 3. Chamadores
- `apps/backend/src/api/store/company/me/route.ts` (API Store)
- `apps/backend/src/api/admin/companies/[id]/route.ts` (API Admin)

## 4. Inputs e Outputs
- **Input:** `UpdateCompanyInput` (Tipado com TS interface, porém sem validação de schemas Zod/Joi no nível do workflow; recebe fields opcionais de company).
- **Output:** O snapshot resultante da execução do service `updateCompanies` (retorna o objeto `company`).

## 5. Steps
1. `updateCompanyStep`:
   - *Ação:* Obtém o estado anterior, chama `updateCompanies` espalhando os dados recebidos.
   - *Compensação:* Executa `updateCompanies` de volta com os dados do snapshot guardado.
2. `createAccountHolderStep` (Chamado condicionalmente via `when` e `transform`):
   - *Ação:* Verifica configuração do Stripe, tenta localizar Links existentes entre COMPANY e PAYMENT, cria account holder no payment provider ("pp_stripe_stripe"), e cria link do Medusa.
   - *Compensação:* Deleta o link com `dismiss` e deleta o account holder via provider.

## 6. Ocorrências inseguras (Casts e Any)
Corrigindo o inventário inicial:
- `: any`: 1 ocorrência (`previousCompany: any` em compensation data).
- `as any`: 6 ocorrências (`company as any`, `previousCompany as any`, `query as any`, `existingLinks[0] as any`, `link as any` (criação), `link as any` (compensação)).
- Total Inseguro: 7 ocorrências confirmadas.

## 7. Validação runtime
- **Validado pela rota:** Normalmente regras do `validator` da rota da API (Zod classes), que filtram payloads de rede.
- **Validado pelo workflow:** Nenhuma verificação de tipos ou guards estritos (e.g., id é passado cegamente). Null e empty não estão explicitamente protegidos para o ID.
- **Riscos de chamada direta:** Chamar o workflow sem a triagem da rota passará payload corrompido, o que invoca services internos com strings ou id indefinido causando `QueryFailedError` no banco.

## 8. Snapshot e compensação
- **Snapshot anterior:** Acessa `retrieveCompany` que retorna a entidade anterior. 
- **Compensação (`updateCompanyStep`):** Extrai explicitamente apenas 12 campos (id, name, email, phone, address, city, state, postal_code, country_code, logo_url, status, spend_limit_reset_frequency).
- **Perdas possíveis:** Outros campos customizados, metadados (`metadata`), relations ou eventuais flags novas que existam na tabela não são revertidas (Compensação Parcial). O status também não pode ser garantido como perfeitamente reversível se `retrieve` estourar antes de pegar o snapshot.

## 9. Transição de status (Ativação)
- **Cálculo (Transição para active):** `company.status === "active" && company.previous_status !== "active"`
- **Vulnerabilidades:**
  - Status inválidos no banco sem restrição.
  - Concorrência de duas requisições simultâneas definindo "active", podem causar race condition criando dois AccountHolders no provider porque a avaliação do status ocorre no JavaScript. 
  - Se a empresa já era `active`, o account holder nunca será criado se ele falhou antes.
  - Não checa se o update explícito alterou para "active", depende de ler `previous_status` que veio do snapshot (se dois pedidos alterarem, um lerá `previous_status` incorreto).

## 10. Stripe e provider
- **Origem provider:** Hardcoded como `"pp_stripe_stripe"`.
- **Stripe desabilitado:** O step retorna `{ skipped: true }` sem interromper a ativação da empresa, significando que a empresa pode ficar ativa SEM account holder (classificado como decisão de negócio pendente; "desabilitado" não é intrinsecamente "seguro").
- **Dados enviados:** Apenas customer_id (company.id) e email (company.email).
- **Dados sensíveis:** Apenas PII básica, sem chaves trafegadas.
- **Risco de Orfanato:** Se a criação do link no Medusa falhar após o Stripe gerar o Customer, o account holder fica órfão no Stripe porque a compensação não cobrirá se ela mesma não foi salva pelo step engine. Na compensação atual, se `link.dismiss` falhar (joga throw), o `deleteAccountHolder` nunca é chamado. Inverter a ordem não é a única correção: é necessário desenhar e testar uma estratégia real de try/catch ou sagas em subfase separada.

## 11. Query e Link
- **Tipos Oficiais Disponíveis:** `ILinkModule` e `RemoteQueryFunction`.
- **Query Graph Return:** O Medusa V2 Query graph retorna tipicamente `{ data: Record<string, any>[], metadata: any }`. Se um array estiver vazio, `existingLinks[0]` será undefined e a chamada do Optional Chaining não quebra.
- **Risco do Link Existente:** Se a Query achar o Link e ele não tiver um `.account_holder` populado, o step criará um novo, causando duplicação ou conflito relacional no `link.create`.
- **Atomicidade:** A compensação é vulnerável porque deletar o link antes de deletar a conta real pode falhar a conta real e você perde a chave (o ID) que vinculava.

## 12. Idempotência
- `updateCompanyStep`: DEPENDENTE DO SERVICE (a API update no medusa é geralmente idempotente mas envia evento todo call).
- `ativação`: VULNERÁVEL A CONCORRÊNCIA.
- `criação do account holder` no Stripe: NÃO IDEMPOTENTE (sem idempotency_key do provider na payload).
- `link.create`: PROVÁVEL.
- `Workflow Completo`: VULNERÁVEL A CONCORRÊNCIA e parcialmente não idempotente.

## 13. Concorrência
Vulnerável nas transições de status da empresa (onde o trigger `was_activated` se apoia na diferença de `previous_status` e `status` calculada em step) e sem locks explícitos na DB.

## 14. Dados sensíveis
E-mail e telefone da empresa circulam livremente no snapshot e trafegam no payload do módulo Payment, não caracterizam token vazado mas PII que exige logger cleanup se logging for ativado no container.

## 15. Testes existentes
Nenhum arquivo `*.spec.ts` associado ao `update-company` foi encontrado no inventário do source backend.

## 16. Testes necessários
A. Type guard explícito e forte para `UpdateCompanyInput`.
B. Teste de handler de update para certificar o isolamento (sem casts any).
C. Teste para Snapshot recuperando estado inteiro em vez de spread seletivo limitador.
D. Teste da compensação validando exatamente quais campos retornam ao estado anterior.
E. Validação lógica para `was_activated` e a transição segura para `active`.
F. Validação com o `isStripeConfigured` retornando false.
G. Validação do abort do Link se account_holder já existe (evitando a re-criação de cliente no stripe).
H. Validação de Link real entre `COMPANY_MODULE` e `PAYMENT`.
I. Fluxo testando as falhas da criação de link (desfazendo customer Stripe).
J. Falhas de compensation handler propagadas ou suprimidas conforme SDK.

## 17. Classificação de risco
- **Classificação Final:** ALTO
- **Justificativa:** Transaciona com provedores externos de pagamento (Stripe), onde os Account Holders (clientes criados) podem ficar órfãos causando inconsistências financeiras graves, vazamento de instâncias não vinculadas e compensação que falha silenciosamente deixando lixo em dependências distribuídas. O `previous_status` lido é propício a race-condition.

## 18. Escopo recomendado para correção
- Implantar type guard `isUpdateCompanyInput`.
- Remover todos os casts de runtime (`as any`).
- Injetar `RemoteQueryFunction` e `ILinkModule` corretamente do Types do framework.
- Corrigir a compensação desenhando uma estratégia real de try/catch no dismiss.
- Passar o payload integral (ou o DTO exato de volta) no snapshot do update em vez de pick de atributos hardcoded.
- Implementar suíte unitária para certificar segurança de tipos.

## 19. Arquivos previstos para a próxima subfase
- `apps/backend/src/workflows/update-company/index.ts`
- `apps/backend/src/workflows/update-company/__tests__/update-company.unit.spec.ts` (A ser criado)
- Atualização deste audit (`docs/recovery/PHASE-2.1-C-UPDATE-COMPANY-AUDIT.md`) para report.

## 20. Bloqueios
Nenhum bloqueio técnico. O workflow carece de tipagens estritas mas todos os módulos e objetos exportados necessários de `@medusajs/framework/types` foram mapeados.

## 21. Subfase 2.1-C.2-C-B.1 — Resultado
- **Correção da contagem de `any`:** Finalizada.
- **Handlers isolados:** Funções separadas para passo (`updateCompanyStepHandler`), wrapper nativo, type-guards em `isUpdateCompanyInput` e compensação de erro testáveis separadamente (`updateCompanyCompensationHandler`).
- **Validação runtime:** Forte proteção com array guards e record casting. Previne inputs malformados chegando aos módulos internos do banco e service layer.
- **Snapshot tipado:** Snapshots agora são definidos rigidamente em tipos `UpdateCompanyCompensationData`, com mapeamentos de campos primitivos suportados.
- **Compensação unitária:** Validada na suíte Jest sem invocar serviços para instâncias que falham tipagem. 
- **Testes criados:** Suíte de 28 casos garantindo comportamento do service. Cobertura explícita a nulls e propriedades vazias.
- **Gates:** Passou integralmente (Linter, Unit Tests, TypeScript Compiler, Webpack Builder).
- **`any` restantes no payment:** 4 usos (`query as any`, `existingLinks as any`, e os acessos aos LinkModules injetados).
- **Payment não alterado:** Manteve o formato do CreateAccountHolder inalterado até próxima subfase.
- **Rollback completo não testado:** Validado como "NÃO" no relatório principal.
- **Idempotência não comprovada:** Mantida incerta até aprovação do fluxo final.
