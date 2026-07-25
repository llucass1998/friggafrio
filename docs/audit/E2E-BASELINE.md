# Auditoria Ponta a Ponta - Baseline Inicial

## Estrutura Encontrada
O projeto é um monorepo (`pnpm-workspace.yaml`, `turbo.json`), contendo:
- `apps/backend`: Medusa v2
- `apps/storefront`: Vite, React 19, Tailwind CSS 4, TanStack Router
- `deploy/`: Arquivos Docker

## Versões
- Node: v24.15.0
- pnpm: 9.4.0
- React: 19.1.1
- TypeScript: 5.8.3
- Vite: 7.1.2
- Medusa: 2.18.0
- Docker Compose: v5.1.4

## Scripts Disponíveis (raiz)
- `dev`: turbo dev
- `build`: turbo build
- `start`: turbo start
- `lint`: turbo lint
- `test`: turbo test
- `backend:dev`: turbo dev --filter=backend
- `storefront:dev`: turbo dev --filter=storefront

## Serviços Necessários
- PostgreSQL (pg_isready não disponível globalmente)
- Redis (redis-cli não disponível globalmente)
- Docker Desktop (instalado e acessível via WSL/Windows)

## Arquivos já modificados
Há 31 arquivos modificados e 24 novos arquivos (`??`) detectados via `git status`, indicando trabalho em progresso abrangendo integrações de frontend (carrinho, header, checkout, rotas, `FloatingActions.tsx`, `HeaderLogo.tsx`) e integrações e webhooks no backend.

## Riscos
- O banco e os serviços Redis parecem estar rodando em contêineres Docker locais. A indisponibilidade de ferramentas globais CLI para pings diretos (pg_isready, redis-cli) exigirá usar `docker compose exec` nas próximas fases.
- Muitas mudanças "untracked" e sujas; os comandos da Fase 1 precisam ser rodados de forma conservadora.

## Fases Executadas e Resolvidas

### Fases 1 & 2: Validação
- Testes E2E (Playwright) ajustados para lidar com a nova logo (FriggaFrio).
- Problemas de Strict Mode resolvidos no seletor `.first()`.
- Handler dos passos customizados no backend expostos externamente para evitar erros em testes unitários.
- Banco de dados de testes (`frigga_test`) configurado na `.env.test` em porta `5433` devido a conflito de porta.

### Fase 3: Validação do Banco e Migrations
- `medusa db:migrate` e scripts executados com sucesso.
- Conflito resolvido no script `03032026-initial-seed.ts` no processo de link entre local de estoque e fornecedor de fulfillment. O link apontava para `manual_manual`, que não estava habilitado. Foi remapeado para `local-pickup_local-pickup`.
- As tabelas de `audit_log` e `customer_profile` foram confirmadas e não requerem edições de migrations anteriores. Status: Aprovado.