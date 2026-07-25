# Relatório de Baseline - Backend Frigga

## Estrutura Encontrada

A estrutura do backend Medusa no monorepo Industrial Starter está assim:

*   **Versão do Medusa:** 2.18.0 (Framework v2)
*   **Módulos Existentes:**
    *   `company`: Módulo B2B/Empresas do starter.
    *   `quote`: Módulo de orçamentos (Request for Quote).
    *   O backend já implementa extensivamente funcionalidades para B2B.
*   **Workflows Encontrados:**
    *   `accept-employee-invite`
    *   `create-company`
    *   `create-company-account-holder`
    *   `delete-company`
    *   `invite-employee`
    *   `setup-company`
    *   `update-company`
*   **Integrações configuradas no `medusa-config.ts`:**
    *   `@medusajs/medusa/payment-stripe` (se `STRIPE_API_KEY` existir).
    *   `@medusajs/medusa/file-s3` (suporte a R2 e S3).

## Riscos Encontrados e Impedimentos Atuais

1.  **Docker Desktop Desligado / Sem Acesso local:**
    *   O comando `docker ps` falha por indisponibilidade do daemon Docker local (Windows). Para rodar as migrations e os testes, precisaremos de um PostgreSQL e Redis (Containers) rodando localmente.
2.  **Variáveis de Ambiente `HMR_PORT` e `HMR_BIND_HOST` (Medusa Admin):**
    *   No comando `medusa build`, a construção do Admin com Vite está falhando porque está usando `process.env.HMR_PORT` dentro da configuração HMR antes da validação. *Foi temporariamente contornado permitindo lintar e gerar arquivos, mas pode estourar na runtime/start.*
3.  **Avisos de Linting Críticos:**
    *   Inúmeros `warnings` no script de Seed (`migration-scripts/03032026-initial-seed.ts`) indicando que os valores estão na unidade menor e o Medusa v2 agora espera *major units* (decimais, ex: `1200` ao invés de `12.00`).
    *   Avisos `no-service-mutations-in-api-route`: Rotas como `company/addresses`, `customers/me/orders`, e `employees` estão modificando dados diretamente pelos Services ao invés de utilizarem Workflows. Padrão atual do Medusa v2 exige Workflows.
    *   Uso de `Error` genérico em vez de `MedusaError`.
4.  **Scripts de Teste:**
    *   O script `test:unit` no `package.json` tenta rodar Jest usando `TEST_TYPE=unit` (sintaxe bash de variável) mas num ambiente Windows. Ele requer o uso do pacote `cross-env` ou configuração via Bash (Git Bash/WSL) para rodar os testes localmente com sucesso.

## Funcionalidades Reaproveitadas

*   **Autenticação e Empresa:** Todo o arcabouço para convites, papéis (roles) dentro da empresa, endereços corporativos e perfis de clientes já está no starter.
*   **Orçamentos:** As rotas API e os Workflows de aceitar, rejeitar e enviar Quotes.

## Funcionalidades Ausentes para B2C e Frigga

Conforme a documentação de requisitos, precisamos implementar:
*   Módulo de Integração de Pagamento com **Mercado Pago** (Pix, Cartão, Boleto).
*   Recebimento de **Webhooks** com idempontência de concorrência.
*   Extensão da conta do cliente com validação/normalização de CPF/CNPJ (PF/PJ).
*   Máquina de estados segura para o Checkout e Reembolsos.
*   Disponibilização de Opções de Entrega (Transportadoras) e Retirada.
*   Auditoria avançada.
*   Notificações e-mail transacionais.
*   Health Checks robustos.

## Plano de Migrations

*   Gerar migrations complementares sem afetar o histórico atual do módulo `company` e `quote`.
*   As novas migrations incluirão tabelas extras como o histórico de auditoria (`audit_log`), rastreio de pagamentos (`payment_attempt`, `payment_webhook_event`), e extensões ao cliente (`customer_profile`).
*   Regra: "Não apagar migrations. Crie novas migrations incrementais."

## Plano de Rollback

*   Como o banco será PostgreSQL e não SQLite, o rollback envolverá gerar arquivos `.down.sql` se usando raw sql, ou garantir que a migration Knex/TypeORM do Medusa tenha o método `down()` implementado de forma segura e idempotente (evitando travar em dependências).
*   Testar os rollbacks localmente antes do push.

## Setup e Infraestrutura

Ajustar o `.env.example` conforme a especificação do documento.
Atualizar o arquivo `package.json` para adicionar testes transplataforma.
Garantir o `docker-compose` e `.github/workflows`.
