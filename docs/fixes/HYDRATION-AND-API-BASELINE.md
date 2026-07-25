# Fase 0 - Auditoria Obrigatória

## Versões e Configuração Encontrada
- **React**: 19.1.1
- **Vite**: 7.1.2 (via `vite build` e TanStack Start setup / router-plugin)
- **TanStack Router**: ^1.144.0 (com `@tanstack/react-router-ssr-query` e `@tanstack/react-start`)
- **TanStack Query**: 5.90.20
- **Medusa SDK**: 2.18.0

## Fluxo SSR
- A aplicação utiliza `createTanStackRouter` configurado para integração SSR com o TanStack Query (`setupRouterSsrQueryIntegration`).
- `src/routes/__root.tsx` provê um HTML base (<html>, <head>, <body>).
- O `Layout` (`src/components/layout.tsx`) atua como layout mestre. Nele encontra-se o spinner de carregamento global.

## Estado de Autenticação (`AuthProvider`)
- O estado inicial de `isAuthenticated` lê `sessionStorage.getItem("auth_state")` condicionalmente (`typeof window !== "undefined"`).
- O estado inicial de `isLoading` é `true` caso `sessionStorage` não tenha registro, ou `false` se houver.
- A função `fetchCustomer` é chamada dentro de um `useEffect` na montagem, o que dispara o processo no cliente logo após o first render.

## Estado de Carrinho (`CartProvider`)
- Não armazena estado no `localStorage` diretamente no state, apenas usa um estado em memória `isOpen`. (A parte de carregamento de dados possivelmente fica no react-query).

## Condição que renderiza o spinner em `layout.tsx`
```tsx
const cachedAuthState = typeof window !== "undefined" ? sessionStorage.getItem("auth_state") : null
const shouldShowLoading = isLoading && (cachedAuthState === "authenticated" || cachedAuthState === null)

if (shouldShowLoading) {
  return <Spinner />
}
```

## Análise de Causa do ERRO 1 (Hydration Mismatch)
O servidor executa `typeof window !== "undefined"` avaliando para `false`.
Logo, no servidor: `cachedAuthState = null`.
Se `isLoading = true` (valor padrão inicial para clientes sem cache, mas como o servidor também avalia sem window, ele pode começar como true ou disparar o fetch). 
No servidor, `shouldShowLoading` será `true`.
O servidor renderiza o `Spinner`.

No cliente (primeiro render), `window` existe. Se não houver nada no `sessionStorage`, `cachedAuthState = null`. Se houver "unauthenticated", `cachedAuthState = "unauthenticated"`.
Se `cachedAuthState = "unauthenticated"`, `shouldShowLoading` será `false` imediatamente no cliente.
Isso causará o Hydration Mismatch, já que o servidor renderizou o spinner (ele acha que `cachedAuthState = null`), e o cliente pode ter "unauthenticated" no storage e não renderizar o spinner.

E mais grave ainda: se o usuário nunca fez login, o servidor sempre renderizará o spinner (pois null passa), e no cliente poderá renderizar o spinner no primeiro render, mas há um atraso e o React reclama da hidratação se os valores não coincidirem perfeitamente antes do useEffect disparar.
E o mais comum para Hydration Mismatch é usar `typeof window` no render ou no useState inicial para desviar a UI. A árvore do cliente e servidor diferem e quebram a hidratação no React 19.

## Análise de Causa do ERRO 2 (Backend Inacessível - ERR_NAME_NOT_RESOLVED)
- No `storefront/.env`, `VITE_MEDUSA_BACKEND_URL=https://api.friggafrio.com.br`
- No browser, a aplicação tenta resolver esse host. Se não há DNS configurado ou local host não mapeia para isso, a chamada falhará (`ERR_NAME_NOT_RESOLVED`).
- Localmente, o backend provavelmente está rodando em `http://localhost:9000` (conforme `medusa-config.ts` fallback para `http://localhost:9000` se não tiver `VITE_MEDUSA_BACKEND_URL`).
- Isso faz com que requisições automáticas do backend para autenticar (`/store/customers/me`) falhem no ambiente local.

## Riscos Identificados
- Remover o fallback de Auth State pode causar tela branca até resolver. É melhor seguir a preferência arquitetural sugerida pelo usuário: renderizar sempre o `PublicLayout` + header/footer estáveis, e mostrar spinners parciais / componentes específicos apenas.
- Refatorar a condicional de Loading global do `layout.tsx` é a solução mais segura para a hidratação e melhor experiência do usuário.
