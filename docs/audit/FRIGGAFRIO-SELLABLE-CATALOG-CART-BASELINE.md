# Baseline do Ambiente - FriggaFrio

## Ferramentas e Versões
- **Node.js**: v24.15.0
- **pnpm**: 9.4.0
- **Medusa Backend**: @medusajs/medusa v2.18.0
- **Medusa SDK**: @medusajs/js-sdk v2.18.0

## Serviços
- **Backend URL**: `http://localhost:9000`
- **Storefront URL**: `http://localhost:5173` (Vite)
- **Database**: PostgreSQL (configurado local via Docker em 5433)
- **Cache**: Redis

## Workspaces
- `apps/backend`
- `apps/storefront`

## Configurações Encontradas
- O backend está rodando no porto 9000 e está usando PostgreSQL/Redis.
- A aplicação frontend (Storefront) roda via Vite (`npm run dev`) na porta 5173 e aponta para a URL do backend via `VITE_MEDUSA_BACKEND_URL=http://localhost:9000`.

## Próximos Passos
- Inventariar os produtos atuais do sistema (Autorizados e Fora do Escopo).
- Validar se o storefront respeita estritamente o `storefront_visible`.
- Revisar `use-cart.ts` para verificar os payloads e evitar o erro 500 no `add-to-cart`.
