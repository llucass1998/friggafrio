# Guia de Rollback e Reativação Comercial — FriggaFrio

Este documento orienta a equipe de engenharia e operações sobre como reverter ou reativar os componentes comerciais do marketplace na Home e no Header da FriggaFrio.

---

## 1. Ponto Seguro de Retorno (Git Snapshot)

- **Branch de Desenvolvimento:** `Maestro`
- **Commit Base Pré-Institucional:** `48ba71f332d87b66d7e7ec2235ec6d5a5b67099f`
- **Branch de Backup Local:** `backup/pre-institutional-homepage`
- **Data do Snapshot:** 20/10/2026

Caso seja necessário restaurar integralmente o estado anterior a esta fase:
```bash
# Para consultar o commit base seguro
git log -1 backup/pre-institutional-homepage
```

---

## 2. Feature Flags Centralizadas

Os componentes comerciais foram preservados integralmente no código-fonte, nos assets e nas rotas do Medusa. A exibição visual na Home e no Header é controlada de forma declarativa e centralizada em:

`apps/storefront/src/config/site-features.ts`

### Estrutura das Flags:

```ts
export const siteFeatures = {
  // Modo institucional da Home: Hero simplificado + Quem Somos + Nossas Lojas + Contato
  institutionalHome: true,

  // Vitrines de produtos na Home (mais vendidos, ofertas, prateleiras por categoria)
  showHomeProductShowcase: false,

  // Grid e carrossel de categorias comerciais na Home
  showHomeCategories: false,

  // Banners promocionais e bloco de benefícios comerciais (10x sem juros, etc.)
  showHomeBenefits: false,

  // Carrossel de marcas parceiras na Home (ativo)
  showHomeBrandCarousel: true,

  // Navegação de produtos no Header (Megamenu de produtos e links diretos)
  showHeaderProductNavigation: false,

  // Submenu de aplicações no Header
  showHeaderApplicationsNavigation: false,

  // Mapa incorporado do Google Maps (iframe) na página de lojas
  showEmbeddedStoreMap: false,

  // Ações comerciais diretas no Header (ex: botão de carrinho)
  showCommerceActions: false,
}
```

---

## 3. Como Reativar o Marketplace Gradualmente

Para reativar as funcionalidades do marketplace sem necessidade de recodificação:

1. Abra `apps/storefront/src/config/site-features.ts`.
2. Para reativar todo o fluxo de compras e catálogo comercial na Home e no Header:
   - Altere `institutionalHome` para `false`.
   - Altere `showHomeProductShowcase` para `true`.
   - Altere `showHomeCategories` para `true`.
   - Altere `showHomeBenefits` para `true`.
   - Altere `showHomeBrandCarousel` para `true`.
   - Altere `showHeaderProductNavigation` para `true`.
   - Altere `showHeaderApplicationsNavigation` para `true`.
   - Altere `showCommerceActions` para `true`.
   - Altere `showEmbeddedStoreMap` para `true` (se desejar reativar o mapa embutido).
3. Execute os testes unitários e de build:
   ```bash
   pnpm --filter storefront test
   pnpm --filter storefront build
   ```
4. Submeta as alterações seguindo o fluxo padrão de release via WSL (`deploy/wsl-deploy.sh`).

---

## 4. O que Permanece Preservado

- **Catálogo de Produtos:** Todas as rotas de produto (`/$countryCode/products/$handle`), categorias (`/$countryCode/categories/$handle`) e busca (`/$countryCode/store`) continuam intactas e funcionais.
- **Backend Medusa v2:** Entidades, preços, estoque Omie, carrinhos, autenticação e dados de pedidos não sofreram nenhuma alteração.
- **Integração WhatsApp:** Os links de compra direta via WhatsApp direcionam para o número oficial `+55 11 92139-6007`.
- **Acessibilidade & Responsividade:** Todas as diretrizes de acessibilidade (painel a11y, navegação por teclado, leitor de tela) permanecem ativas e validadas.
