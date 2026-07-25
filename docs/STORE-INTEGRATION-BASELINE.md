# Store Integration Baseline

## Estrutura Encontrada
- **Página Inicial:** `apps/storefront/src/pages/public-home.tsx` (Renderiza Hero, Featured e Contact Banner)
- **Componente Hero:** `apps/storefront/src/components/home/HeroSection.tsx` (Texto alinhado à esquerda, badge 'Especialistas', placeholder visual à direita "Equipamentos Friggafrio")
- **Header:** `apps/storefront/src/components/public-header.tsx` (delegando renderização para `FullStoreHeader.tsx` e `StickyCommerceHeader.tsx`)
- **Footer:** `apps/storefront/src/components/public-footer.tsx` e `footer.tsx`

## Rotas
A aplicação é baseada no **TanStack Router**:
- Estrutura hierárquica usando rotas como `__root.tsx`, `$countryCode.tsx`, `store.tsx`, etc.
- O mock do `$countryCode/index.tsx` redireciona para `/br/` via `public-home.tsx`.

## SDK Medusa e Estado de Autenticação Atual
- **Cliente:** Uso do `@medusajs/js-sdk`.
- **Autenticação e Carrinho (Providers):** Estão espalhados em `auth-context.tsx`, `cart.tsx`.
- Existe `use-auth.ts`, `use-cart.ts` mas que foram temporariamente mochados (devido ao bug recente que isolou o Medusa).
- Banco: PostgreSQL está configurado no backend (DATABASE_URL vazio ou inacessível no setup recém configurado pelo usuário).

## Problemas e Mocks Anteriores
Durante a fase de contrução visual do MegaMenu e Header Compacto, o acesso real ao Medusa via Loader SSR do TanStack foi modificado para retornar mocks (vazio ou objects estáticos), pois o Medusa Backend estava gerando `fetch failed` e timeout de banco de dados.
Portanto, existe **desconexão temporária** entre a UI e a API real do Medusa na região/lista de produtos, feitas em `lib/data/regions.ts` e afins.

## Checklist de Recursos do Medusa
- [ ] Products/Store (Mock)
- [ ] Cart (Mock / Local)
- [ ] Customer Auth (Mock / Local)
- [ ] Checkout (Incompleto/Mock)

## Qualidade Atual (Baseline)
- O Build via `npm run build` foi iniciado recentemente e continuará rodando.
- Os testes estão baseados em Playwright na pasta `/tests/`, mas sem testes rodando no pipeline contínuo.

---
> Auditoria concluída manualmente, pois a ausência de commit roots profundos limitou o sub-agente.
