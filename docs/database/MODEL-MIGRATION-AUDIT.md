# Auditoria de models, workflows e migrations

Data: 2026-07-26 02:20 -03:00
Responsável: IDE Agent
Estado: **REPROVADA**

## Resumo

O schema customizado agora é reproduzível em banco vazio e em cópia restaurada do
banco de desenvolvimento. Quatro módulos que possuíam model sem migration passaram a
ter migrations versionadas. Índices e constraints críticos foram adicionados e seis
scripts capazes de criar catálogo, preços ou estoque não homologados foram retirados
do runtime.

A fase não é considerada 100% finalizada porque a auditoria encontrou 96 usos
preexistentes de `any`, `@ts-ignore` ou equivalentes em workflows e rotas. Eles estão
mapeados para as fases de autenticação, autorização, empresa, frete e orçamentos.

## Baseline do banco existente

O banco `frigga` foi consultado somente por metadados e contagens. Antes das novas
migrations, continha cinco tabelas customizadas:

- `company`;
- `company_address`;
- `employee`;
- `product_sales_policy`;
- `quote`.

Models sem tabela/migration no banco existente:

- `audit_log`;
- `customer_profile`;
- `payment_attempt`;
- `payment_webhook_event`.

O banco original não foi migrado nem apagado. Foi criado um dump em formato custom,
com 618.468 bytes e hash SHA-256 válido de 64 caracteres, restaurado em banco
temporário e mantido no diretório temporário local como evidência.

## Mapa customizado

| Model/módulo        | Tabela                  | Migrations                     | Workflow/uso                                            | Relações e índices                                                      | Estado                                               |
| ------------------- | ----------------------- | ------------------------------ | ------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------- |
| Company             | `company`               | 20260212203026, 20260220203633 | setup/create/update/delete company                      | employee/address via FK; email único; status e frequência com check     | Schema sincronizado; tipos de workflows pendentes    |
| Employee            | `employee`              | 20260212203026                 | convite, aceite e setup                                 | FK/index para company; link com customer                                | Schema sincronizado; autorização pendente            |
| CompanyAddress      | `company_address`       | 20260227124348, 20260227170822 | CRUD de endereços                                       | FK/index para company                                                   | Schema sincronizado; mutations em workflow pendentes |
| Quote               | `quote`                 | 20260224030847, 20260726051329 | solicitar/enviar/aceitar/rejeitar/reordenar             | links read-only para customer/cart/order/order-change; cinco índices    | Schema sincronizado; `any`/`@ts-ignore` pendentes    |
| ProductSalesPolicy  | `product_sales_policy`  | 20260725033401, 20260726051328 | repair dry-run e leitura pública                        | link 1:1 lógico com product; `product_id` único                         | Sincronizado e sem duplicatas na cópia               |
| CustomerProfile     | `customer_profile`      | 20260726051325                 | rota `/store/customer-profile`                          | customer único; hash único; bundle cifrado/termos com checks            | Sincronizado; API não expõe material cifrado         |
| PaymentAttempt      | `payment_attempt`       | 20260726051326                 | nenhum fluxo ativo enquanto pagamentos estão bloqueados | idempotency única; provider/payment único; status enum; 3 checks        | Persistência pronta, processamento bloqueado         |
| PaymentWebhookEvent | `payment_webhook_event` | 20260726051327                 | webhook responde 503 até homologação                    | provider/event único; índices de payment/status/request; attempts check | Persistência pronta, processamento bloqueado         |
| AuditLog            | `audit_log`             | 20260726051324                 | step tipado `create-audit-log`                          | índices resource/action/correlation; actor/result enum                  | Schema e step sincronizados                          |

Módulos oficiais de order, inventory, reservation e payment continuam sob migrations
do Medusa 2.18.0. A inspeção confirmou índices de order/customer/display,
inventory-item/SKU, inventory-level/location+item, reservation/item/location e
order-summary/order+version.

## Migrations novas

- `audit-log/migrations/Migration20260726051324.ts`;
- `customer-profile/migrations/Migration20260726051325.ts`;
- `payment-attempt/migrations/Migration20260726051326.ts`;
- `payment-webhook-event/migrations/Migration20260726051327.ts`;
- `product-sales-policy/migrations/Migration20260726051328.ts`;
- `quote/migrations/Migration20260726051329.ts`.

Todas foram geradas pelo CLI `medusa db:generate`. Uma segunda geração nos mesmos
seis módulos retornou “No changes detected” e manteve a contagem em 12 migrations.

## Constraints e índices adicionados

### Documentos e consentimento

- CPF/CNPJ não é mais gravado em texto normalizado.
- Persistência usa ciphertext, IV, auth tag, hash HMAC e últimos quatro dígitos.
- O check `customer_profile_document_bundle_check` exige todos os campos juntos.
- O check `customer_profile_terms_bundle_check` exige data e versão juntas.
- `customer_id` e `document_hash` têm unicidade lógica entre registros não excluídos.
- `DATA_ENCRYPTION_KEY` ausente ou inválida falha de forma fechada.

### Pagamento e webhook

- `idempotency_key` é única.
- `(provider, provider_payment_id)` é único quando o ID existir.
- amount deve ser não negativo, attempt number deve ser positivo e currency code deve
  ter três caracteres.
- status de tentativa e processamento de webhook usam enums com check.
- `(provider, provider_event_id)` é único para bloquear replay.
- attempts do webhook não pode ser negativo.

Nenhuma dessas tabelas habilita pagamento. Refund, webhook Mercado Pago, checkout
customizado e confirmação arbitrária continuam respondendo 503.

### Catálogo, quote, estoque e pedidos

- uma única política ativa por produto;
- índices de quote por customer, status, draft order, order change e cart;
- zero políticas duplicadas na cópia existente;
- zero quotes órfãs de customer ou cart;
- zero reservations órfãs de inventory item;
- zero pares duplicados de inventory item/location.

Não foram adicionadas FKs diretas entre módulos Medusa; os relacionamentos
cross-module continuam nos module links oficiais.

## Seeds e scripts

Contagem atual de `apps/backend/src/migration-scripts`: **0**.

Foram preservados em `.local-quarantine/` e removidos do runtime:

- dois migration scripts que criavam produtos/estoque;
- quatro scripts de seed/repair comercial;
- treze scripts soltos de banco, região, frete, preço e patch;
- provider Mercado Pago não homologado;
- provider de fulfillment com preço zero.

A migration completa, sem `--skip-scripts`, foi executada duas vezes. Depois da
primeira execução:

- produtos: 0;
- variantes: 0;
- preços: 0;
- inventory items: 0.

`apps/backend/scripts/ci/assert-no-commercial-seed.mjs` repete essa verificação no CI
e reprova se dados comerciais forem inseridos por migration.

## Cenários executados

### Banco vazio

- migration completa: exit 0;
- 9 tabelas customizadas;
- 7 índices críticos verificados;
- 6 checks críticos verificados;
- 0 órfãos na tabela de link product/policy;
- segunda execução: exit 0, schema já atualizado;
- banco temporário removido: exit 0.

### Cópia do banco existente

- `pg_dump`: exit 0;
- restore isolado: exit 0;
- migration: exit 0;
- rollback dos seis módulos: exit 0;
- tabelas customizadas após rollback: 5, igual ao baseline;
- novos índices após rollback: 0;
- nova migration: exit 0;
- validação final 9/7/6: aprovada;
- banco temporário removido: exit 0.

## Workflows auditados

As implementações antigas de checkout, refund e webhook usavam campos que não
existiam nos models, chaves de módulo incorretas, valores fixos e vários `any`. Esses
workflows foram removidos; suas rotas permanecem fail-closed em 503.

O step de audit log foi alinhado a `actor`, `actor_type`, `resource`, `resource_id`,
`result`, `correlation_id`, `before_state` e `after_state`, usando o identificador real
`auditLog`.

Pendências tipadas encontradas:

- setup e update de company;
- setup de customer/auth;
- links e account holder;
- quotes, reorder e order previews;
- middleware de company setup;
- rotas de employee/address/payment methods;
- upload e Google Places;
- shipping method.

Total do scan: **96 ocorrências inseguras**. Nenhuma foi introduzida pelas migrations
novas. Elas impedem o status FINALIZADA.

## Resultado dos gates

- backend build: aprovado;
- backend TypeScript: aprovado, 0 erro;
- backend lint: 0 erros e 22 warnings;
- unitários: 6 suítes e 25 testes aprovados;
- integração HTTP/PostgreSQL: 1 suíte e 1 teste aprovado;
- migration vazia/existente/repetida: aprovada;
- rollback: aprovado;
- guard contra seed: aprovado;
- `db:generate` repetido: nenhuma mudança detectada.

## Pendências

1. Remover os 96 usos inseguros nas fases funcionais correspondentes.
2. Criar migrations futuras para histórico versionado de consentimentos na Fase 32.
3. Homologar dados comerciais antes de criar qualquer seed.
4. Homologar frete na Fase 16 e gateway/webhook nas Fases 17–18.
5. Repetir a migration em staging antes de qualquer produção.
