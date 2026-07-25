# Checklist de Integração Frontend & Commerce (Friggafrio)

## Fase 0: Baseline & Auditoria (Concluído)
- [x] Criar `docs/STORE-INTEGRATION-BASELINE.md`.
- [x] Documentar o status atual do header, layout, rotas e dependências.

## Fase 1: Hero & Produto Showcase (Concluído)
- [x] Instalar `embla-carousel-react`.
- [x] Substituir a imagem estática vazia no `HeroSection.tsx` pelo carrossel.
- [x] Criar componente `ProductShowcaseCarousel.tsx`.
- [x] Documentar as imagens necessárias em `docs/SHOWCASE-IMAGES.md`.
- [x] Implementar fallback e acessibilidade.

## Fase 2: Página "Nossa Loja" (Concluído)
- [x] Criar arquivo de rota `public-stores.tsx`.
- [x] Implementar página institucional de lojas (`StoreMap`, `StoreLocationCard`).
- [x] Configurar integração visual com Google Maps embed.
- [x] Atualizar Header, Mobile Menu e Footer para lincar `/br/nossa-loja`.
- [x] Criar `config/store.ts` para dados centralizados das lojas.

## Fase 3: Autenticação (Medusa) (Concluído)
- [x] Remover mock do AuthContext (`throw new Error`).
- [x] Reconectar chamadas do Store API do Medusa (`useAuth`).
- [x] Atualizar tela de Login para o padrão visual do e-commerce (Tailwind 4, pt-br).

## Fase 4: Carrinho Integrado (Medusa) (Concluído)
- [x] Atualizar `CartDropdown` no `HeaderActions.tsx`.
- [x] Converter visualização do carrinho de drop/modal para `Drawer` (slide da direita).
- [x] Traduzir `cart.tsx` para pt-br (texto da listagem, vazios).
- [x] Verificar import e tipagem do `cartItemCount` usando o cart SDK.

## Fase 5: Revisão e Qualidade (Concluído)
- [x] Checar se os Links em Header, Mobile Drawer e Footer apontam corretamente.
- [x] Rodar build para checar erros do TypeScript/Vite/ESBuild.
- [x] Validar design system variables (`--color-navy`, `--color-primary`, `--color-accent`).

---
Última Atualização: 24/07/2026