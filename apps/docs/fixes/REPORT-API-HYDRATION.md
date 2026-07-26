# Relatório Final: Resolução de API e Hydration Mismatch

## 1. Problema da URL
A variável de ambiente e o fallback local vazaram o link para o ambiente de produção localmente, causando as requisições `ERR_NAME_NOT_RESOLVED` do client (e de AuthContext).

**Ações executadas:**
1. A API Backend URL apontava para `https://api.friggafrio.com.br` no env original;
2. As urls `MEDUSA_BACKEND_URL` foram purgadas do código que acessava `import.meta.env` repetidas vezes ou aplicava fallbacks perigosos;
3. Criado o arquivo `apps/storefront/src/config/env.ts`, atuando como ponto único e rigoroso de checagem. Caso as env vars não constem lá, o sistema acusa erro em dev em vez de silenciar para o domínio de prod.
4. Criado `apps/storefront/src/lib/medusa.ts` como singleton do SDK;
5. Removido `apps/storefront/src/lib/utils/sdk.ts`;
6. Atualizados os 32 arquivos para referenciar a nova instância;
7. Modificado `apps/storefront/.env` para `VITE_MEDUSA_BACKEND_URL=http://localhost:9000`;
8. O arquivo `.env.production` permanece sendo o único lugar para deploy com a URL `api.friggafrio.com.br`.

## 2. CORS do Backend
A porta do frontend `5174` (diferente da padrão do vite) foi adicionada explicitamente em:
`apps/backend/.env` sob `STORE_CORS` e `AUTH_CORS` para garantir que AuthContext funcione livre de bloqueios pré-flight no ambiente local.

## 3. Hydration Mismatch (`FeaturedProducts` e `FeaturedCategories`)
**Causa Exata:** SSR avaliava o cache sem `window` ou sem as permissões corretas (trazendo null) gerando `isLoading=true`. No lado cliente, a mesma view poderia tentar acender a flag e disparar o request em tempos diferentes, quebrando a equalidade das trees (um renderizando o skeleton e o outro um empty string/grid sem items).

**Ações executadas:**
1. Criado `apps/storefront/src/lib/hooks/use-hydrated.ts` (baseado em `useSyncExternalStore`);
2. Esse hook expõe um boolean: Server side = false; Client First Render = false; Após o paint real (effect) = true.
3. Componentes `FeaturedProducts` e `FeaturedCategories` agora recebem `useHydrated()` e a query é `enabled: hydrated`.
4. Os layouts validam isso gerando a UI unificada do Skeleton durante o carregamento. 
5. Separação de 3 estados de UI: Skeletons (quando !hydrated || pending), Error UI e Empty UI (apenas pós-sucesso com array de `0` itens).

## 4. Auth Context
O `sessionStorage` foi encapsulado via useEffect sem comprometer a estrutura inicial e sem `typeof window` no `useState` inicial. Isso tira o spinner central e respeita as chamadas limitadas sem duplo fetch de UI no Header e Layout.

## 5. Auditoria de Caches
- As pastas `.vite`, `dist`, `.tanstack` e `node_modules/.vite` do Storefront foram sumariamente deletadas e o Vite Cache destruído.
- `pnpm lint`, `typecheck` e `build` passaram com sucesso limpo.
