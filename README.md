<div align="center">

❄️ FriggaFrio

Plataforma de e-commerce headless para o segmento de refrigeração








</div>

📌 Sobre o projeto

O FriggaFrio é uma plataforma de comércio eletrônico em desenvolvimento para uma empresa do segmento de refrigeração. O projeto foi estruturado como um monorepo, separando storefront e backend para facilitar evolução, testes, deploy e manutenção.

A solução utiliza arquitetura headless com Medusa v2 no backend e uma interface moderna construída com React 19, TypeScript, Vite e Tailwind CSS.

O objetivo é centralizar catálogo, experiência de compra, carrinho, checkout, pedidos e integrações em uma base técnica preparada para crescer de forma organizada.

🚧 Projeto real em desenvolvimento. Algumas integrações e fluxos comerciais ainda estão sendo evoluídos e validados antes da entrada definitiva em produção.

✨ Principais funcionalidades

Catálogo de produtos e categorias.

Storefront responsivo para desktop e mobile.

Carrinho de compras.

Fluxo de checkout.

Gestão de clientes e autenticação.

Pedidos e acompanhamento de status.

Estrutura para opções de entrega e fulfillment.

Painel administrativo baseado no ecossistema Medusa.

Integração entre storefront e backend via APIs.

PostgreSQL para persistência de dados.

Redis como infraestrutura de apoio ao backend.

Feature flags para habilitação de pagamentos.

Integrações Google configuráveis por variáveis de ambiente.

Testes unitários e E2E.

Ambiente Docker para desenvolvimento e produção.

🏗️ Arquitetura

flowchart LR
    U[Cliente] --> S[Storefront<br/>React + TypeScript + Vite]
    S --> API[Backend<br/>Medusa v2]
    API --> DB[(PostgreSQL)]
    API --> R[(Redis)]
    API --> EXT[Integrações externas]
    S --> EXT

O repositório utiliza pnpm workspaces + Turborepo, permitindo executar e validar os diferentes módulos a partir da raiz.

🧰 Stack

Storefront

React 19

TypeScript

Vite

Tailwind CSS

TanStack Query

TanStack Router

React Hook Form

Zod

Playwright

Backend

Medusa v2.18

Node.js

TypeScript

PostgreSQL

Redis

Jest

Zod

Infraestrutura e qualidade

pnpm

Turborepo

Docker / Docker Compose

NGINX

Git / GitHub

ESLint

Typecheck com TypeScript

Testes unitários e E2E

📁 Estrutura do repositório

friggafrio/
├── apps/
│   ├── backend/          # Backend Medusa v2 e Admin
│   ├── storefront/       # Loja React/Vite
│   └── docs/             # Documentação complementar
├── deploy/               # Docker Compose, NGINX e scripts de deploy
├── docs/                 # Relatórios e documentação técnica
├── package.json          # Scripts do monorepo
├── pnpm-workspace.yaml   # Configuração dos workspaces
└── turbo.json            # Pipeline do Turborepo

🚀 Executando localmente

Pré-requisitos

Node.js 20+

pnpm 10+

Docker e Docker Compose

1. Clone o projeto

git clone https://github.com/llucass1998/friggafrio.git
cd friggafrio

2. Instale as dependências

pnpm install

3. Suba PostgreSQL e Redis

docker compose -f deploy/docker-compose.local.yml up -d

A stack local expõe por padrão:

PostgreSQL: localhost:5433

Redis: localhost:6379

4. Configure o backend

cp apps/backend/.env.example apps/backend/.env

Se estiver utilizando o Docker Compose local fornecido pelo projeto, ajuste:

DATABASE_URL=postgres://postgres:postgrespassword@localhost:5433/frigga
REDIS_URL=redis://localhost:6379

Substitua também os secrets de desenvolvimento e configure apenas as integrações necessárias ao ambiente.

5. Configure o storefront

cp apps/storefront/.env.example apps/storefront/.env

Variáveis principais:

VITE_MEDUSA_BACKEND_URL=http://localhost:9000
VITE_MEDUSA_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_PORT=5174

6. Execute os serviços

Backend:

pnpm backend:dev

Storefront:

pnpm storefront:dev

Ou execute o workspace:

pnpm dev

🧪 Qualidade e testes

Monorepo

pnpm lint
pnpm test
pnpm build

Storefront

pnpm --filter storefront typecheck
pnpm --filter storefront test:unit
pnpm --filter storefront test:e2e

Backend

pnpm --filter backend typecheck
pnpm --filter backend test:unit
pnpm --filter backend test:integration

O projeto utiliza lint, typecheck, testes e build como parte do processo de evolução e revisão técnica.

🐳 Deploy

A pasta deploy/ contém infraestrutura para execução com containers, incluindo:

Backend Medusa.

PostgreSQL 16.

Redis 7.

NGINX como reverse proxy.

HTTPS com Let's Encrypt/Certbot.

Configurações para ambiente local e produção.

Consulte deploy/README.md para os detalhes do fluxo de infraestrutura.

🗺️ Evolução do projeto

O FriggaFrio está sendo desenvolvido de forma incremental, priorizando estabilidade e validação dos principais fluxos antes da publicação definitiva.

Entre os pontos de evolução estão:

Consolidação do checkout e fulfillment.

Evolução das integrações de pagamento.

Integração com processos fiscais/ERP.

Ampliação da cobertura de testes.

Observabilidade e monitoramento.

Hardening de segurança e configuração de produção.

Melhoria contínua da experiência mobile e desktop.

👨‍💻 Autor

Lucas de Souza Furtado Mendonça





<div align="center">

FriggaFrio — tecnologia aplicada a uma experiência de compra mais simples para o mercado de refrigeração.

</div>
