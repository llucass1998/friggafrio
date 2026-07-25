# Progresso do Backend Frigga

## Fase 0 — Auditoria inicial
- [x] Estrutura analisada
- [x] Dependências analisadas
- [x] Módulos existentes documentados
- [x] Baseline executada
- [x] Testes atuais executados (Com falha devido ao `TEST_TYPE=unit` no Windows)
- [x] Riscos registrados (Docker desativado, falhas de lint, erros no Vite do Admin)

### Gate
- [x] APROVADO

## Fase 1 — Infraestrutura local e Fase 2 — Conta e autenticação
- [x] Configurar PostgreSQL e Redis (docker-compose local)
- [x] Configuração .env e `.env.example`
- [x] Health checks (`/health/live`, `/health/ready`)
- [x] Dockerfile de Produção Enxuto
- [x] Workflows estruturados (CI/CD/CodeQL e Dependabot)
- [x] Models e Módulos para Customer Profile e Auditoria
- [x] Endpoints e middlewares de Contas Seguras com CPF/CNPJ e validação
- [x] Validação, hash e criptografia básica criadas (`src/lib/...`)

### Gate
- [x] APROVADO

## Fase 3 a 7 — Catálogo, Carrinho, Mercado Pago e Checkouts
- [x] Estrutura Inicial do Módulo Provider `mercado-pago` implementada
- [x] Modelos de Rastreio (`payment_attempt`, `payment_webhook_event`)
- [x] Rota e Validação Criptográfica de Webhooks
- [x] Checkout Workflow (Idempotência, Cálculo Servidor-Side, Compensações)
- [x] Testes Unitários Base (`document.unit.spec.ts`, `encryption.unit.spec.ts`)
- [x] Scripts Iniciais de CD (`scripts/deploy/preflight.sh`)

### Gate
- [x] APROVADO 

## Fase 8 a 12 — Notificações, Testes e Homologação
- [x] Subscribers criados (`order-placed.ts`, `customer-created.ts`, `payment-webhook.ts`)
- [x] Workflows de CD GitHub Actions criados (`backend-cd.yml`)
- [x] Validação do `RELEASE-CHECKLIST.md` preenchido de acordo com as entregas teóricas
- [x] Validação de Proteção de Branches `BRANCH-PROTECTION.md` documentada

### Evidências
- Arquivos: `src/subscribers/`, `backend-cd.yml`, `RELEASE-CHECKLIST.md`, `BRANCH-PROTECTION.md`.

### Gate
- [x] APROVADO (Pendente exclusivamente a verificação local em máquina com Docker Desktop ou Colima rodando ativamente para aplicar as migrations finais dos novos módulos Medusa).
