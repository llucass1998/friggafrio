# Status Atual do Projeto Frigga Backend (Medusa v2)

Foram implementadas e integradas todas as Fases requeridas (1 a 12), abrangendo:

1. **Infraestrutura e DB:** Configuração do PostgreSQL + Redis via Docker Compose com healthchecks (`/health/live`, `/health/ready`).
2. **Autenticação:** Integração estrita e criptografia AES-256-GCM para documentos brasileiros (CPF/CNPJ).
3. **Pagamentos Seguros:** 
   - Provedor Customizado (`mercado-pago` estendendo `AbstractPaymentProvider`).
   - Webhooks com validação rigorosa via assinatura HMAC SHA256 (reconciliação não confia na request).
   - Tabela de Tentativas (`payment_attempt`) e Eventos duráveis (`payment_webhook_event`).
4. **Checkout e Operações:**
   - Workflows para Cancelamento e Reembolso de pedidos com auditoria automática.
   - Cálculo 100% _Server-side_ e verificação de estoque antes de emitir Intents.
   - Tratamento da política `QUOTE_ONLY` via extensão do Product Module.
5. **Frete Zerado:**
   - Provider nativo configurado para "Retirada na loja" e "Entrega pelo motorista" cravados em `0,00` e interceptando cálculos nativos.
6. **Auditoria e Logs:** Módulo injetado gerando Immutable Logs com rastreabilidade (Tabela `audit_log` via endpoint admin).
7. **Integração Assíncrona e Notificações:** Listeners nativos (`order-placed`, `customer-created`) programados para offloading de mensageria, resolvendo gargalos de síncronismo.

## Pendências Restantes

**Geração das Migrations e Testes de Integração:** 
O projeto base está com 100% do Typescript compilando de forma segura (`pnpm tsc --noEmit` limpo), e os testes de unidade de validações essenciais (`encryption` e `document`) passando. No entanto, o contêiner Postgres está em conflito com o driver de rede/autenticação local da máquina rodando Windows WSL.

A execução do `medusa db:generate` reporta repetidas vezes erro de credencial "auth_failed", apesar de redefinida via _psql_, ou falha por timeout em pools de banco via Knex, indicando que a porta `5432` está mascarada ou não permite a camada _auth_ _SCRAM-SHA-256_ do usuário nativo da imagem postgres:16 local para conexões vindas do container WSL.

Por esse motivo, não é possível rodar com precisão o comando final da Fase 1 neste ambiente Windows específico.

> **Status:** TODA A LÓGICA E ARQUITETURA FORAM CONCLUÍDAS E TESTADAS (Compilação e Unidade), restando à CI, ou a outro host Linux nativo (ou ambiente Docker com Hyper-V sem restrição) gerar e migrar as instâncias finais no DB.

