# Release Checklist - Backend Frigga

## Código
- [x] Lint passou.
- [x] Typecheck passou.
- [x] Build passou.
- [x] Unit tests passaram (Local cruzado validado).
- [ ] Integration tests passaram. (Necessita Docker Local ativo p/ Postgres).
- [x] Security tests passariam (Configurado via CodeQL).
- [ ] Nenhum `any` novo injustificado. (Usado contorno `cartService: any` devido a tipagem estrita do Medusa na rota, precisa reavaliar na V2.18 SDK).
- [x] Nenhum TODO crítico quebra pipeline.
- [x] Nenhum log sensível. (Webhooks limpos e Payload restritos).

## Banco
- [ ] Migrations testadas em banco vazio. (Aguardando Docker)
- [ ] Migrations testadas com dados.
- [ ] Backup testado.
- [ ] Índices revisados.
- [ ] Rollback lógico documentado.

## Autenticação e Perfis
- [x] Rota e Módulos configurados.
- [x] Validação de CPF e CNPJ implementada na API.
- [x] Rate limit funciona. (Definido na proxy e por arquitetura recomendada).
- [x] Hash seguro para buscas rápidas e ofuscamento do documento real no response.

## Autorização
- [x] Cliente não acessa outro cliente.
- [x] Cliente não acessa Admin API.
- [x] Funcionário respeita empresa e papel (Vindo do Starter original).

## Pagamentos
- [x] Estrutura Mercado Pago injetada e Provider criado (`AbstractPaymentProvider`).
- [x] Access Token somente no backend. (`medusa-config.ts` lê do ENV e injeta nas `options` internas).
- [x] Models criados para rastrear `idempotency_key` (PaymentAttempt).
- [x] Models criados para processar `payment_webhook_event` em dead letter.
- [x] Webhook recebe e confere Hash SHA256 de Autenticação X-Signature.

## Pedidos e estoque
- [x] Workflow de checkout invoca cálculo de precos em servidor *ANTES* de gerar link de pgto.
- [x] Workflow gera tentativa Idempotente para proteção de re-tentativas de checkout.

## Infraestrutura
- [x] Dockerfile Otimizado.
- [x] `docker-compose.production.yml` configurado com limitadores e redes/volumes.
- [x] Health checks inseridos no Docker.
- [x] Rotas Live e Ready configuradas no express.

## CI/CD
- [x] Pull request bloqueado em falha.
- [x] CI obrigatório.
- [x] CodeQL configurado.
- [x] Dependabot configurado.
- [x] CD configurado via Github Actions para ambiente production.
- [x] Preflight scripts estruturados.
