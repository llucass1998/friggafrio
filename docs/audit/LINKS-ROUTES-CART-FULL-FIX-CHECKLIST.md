# Checklist de Correção de Links e Carrinho

## 1. Identificação de Portas
- [x] Frontend Port: Vite (Padrão 5173 / configurado)
- [x] Backend Port: Medusa (Padrão 9000 / configurado)

## 2. Reprodutibilidade e Rotas (`/undefined`)
- [ ] Mapear arquivos `Link` do `@tanstack/react-router` ou `a` que usam `params={{ countryCode }}`.
- [ ] Identificar a origem do `countryCode` null/undefined (ex: fallback padrão, estado do contexto).
- [ ] Corrigir builder de URLs em componentes como Logo, PublicProductCard, etc.

## 3. Módulo de Produtos
- [ ] Auditar `PublicProductCard.tsx` (ou equivalentes).
- [ ] Evitar que botões de "Add to cart" ou redirecionamentos passem `/undefined`.

## 4. Carrinho (CartProvider e Add to Cart)
- [ ] Localizar `CartProvider` (provavelmente em `apps/storefront/src/components/cart.tsx` ou similar).
- [ ] Verificar persistência em LocalStorage (`cart_id`).
- [ ] Garantir que exista apenas UMA instância de `CartProvider` rodando (ou que o estado global seja unificado).
- [ ] Fixar ação "Add to Cart" para criar carrinho (se nulo) e prosseguir com a inserção do item via Medusa JS SDK.

## 5. Ferramentas e Validação
- [ ] Executar script de crawling local `check-storefront-links.mjs`.
- [ ] Validar UI de Carrinho (Badge, Drawer/Sidebar, Refresh).
- [ ] E2E testes executados.
