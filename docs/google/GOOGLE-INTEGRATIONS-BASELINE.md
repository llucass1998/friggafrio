# GOOGLE INTEGRATIONS BASELINE

## Componentes Encontrados
- Rota de "Nossa Loja" mapeada em `apps/storefront/src/routes/nossa-loja.tsx` (componente `PublicStoresPage` em `apps/storefront/src/pages/public-stores.tsx` ou similar).
- Rotas de login e cadastro usando auth-context do Medusa.

## Integrações Existentes
- Inicialmente nenhuma integração direta com Places API ou Google Identity Services. Apenas `VITE_GOOGLE_MAPS_EMBED_API_KEY` vazia no `.env.example`.

## APIs Antigas Encontradas
- Não detectadas implementações legadas de `gapi.auth2` até o momento.

## Variáveis Encontradas
- `VITE_GOOGLE_MAPS_EMBED_API_KEY` (Storefront)

## Fluxo Atual de Autenticação
- Medusa Store API (`emailpass` default provider).

## Fluxo Atual de Carrinho
- Contexto `CartProvider`, carrinho de visitante preservado e atualizado no login via hooks do Medusa.

## Resultado da Baseline
- Lint e typecheck a serem validados.
