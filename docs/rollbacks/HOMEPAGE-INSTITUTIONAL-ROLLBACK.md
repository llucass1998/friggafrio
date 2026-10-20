# Guia de Rollback e Reativação Comercial — FriggaFrio

Este documento orienta a equipe de engenharia e operações sobre como reverter ou reativar os componentes comerciais do marketplace na Home, no Header, no Footer e nas rotas de compra da FriggaFrio.

---

## 1. Ponto Seguro de Retorno (Git Snapshot)

- **Branch de Desenvolvimento:** `Maestro`
- **Commit Base Pré-Institucional:** `48ba71f332d87b66d7e7ec2235ec6d5a5b67099f`
- **Tag / Branch de Retorno Pré-Institucional:** `backup/pre-institutional-homepage`
- **Tag de Retorno Ocultação do Marketplace:** `backup/pre-institutional-marketplace-hide`
- **Data do Snapshot:** 20/10/2026

Caso seja necessário restaurar integralmente o estado anterior a esta fase:
```bash
# Para consultar o commit base seguro
git log -1 backup/pre-institutional-homepage
# Para consultar o ponto antes da ocultação total do marketplace
git log -1 backup/pre-institutional-marketplace-hide
```

---

## 2. Feature Flags Centralizadas

Os componentes comerciais foram preservados integralmente no código-fonte, nos assets e nas rotas do Medusa. A exibição visual na Home, no Header, no Footer e nas páginas de produtos é controlada de forma declarativa e centralizada em:

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

  // Carrossel de marcas parceiras na Home (ativo e visível na parte inferior)
  showHomeBrandCarousel: true,

  // Navegação de produtos no Header (Megamenu de produtos e links diretos)
  showHeaderProductNavigation: false,

  // Submenu de aplicações no Header
  showHeaderApplicationsNavigation: false,

  // Mapa incorporado do Google Maps (iframe) na página de lojas (ativo em /nossa-loja, ausente da Home)
  showEmbeddedStoreMap: true,

  // Exibição do link e acessos à Central de Ajuda
  showHelpCenter: false,

  // Exibição do componente "Informe seu CEP / Calcule a entrega" no Header
  showDeliveryEstimate: false,

  // Ações comerciais diretas no Header e layout (ex: botão do carrinho, drawer)
  showCommerceActions: false,

  // Exibição de elementos comerciais no rodapé (formas de pagamento online e avisos de e-commerce)
  showCommerceFooter: false,

  // Exibição de login, cadastro, minha conta e pedidos na navegação (ativo: permite login Medusa Admin e conta do cliente)
  showCustomerAccount: true,

  // Exibição de favoritos vinculados ao perfil comercial (ativo: salvar produtos de referência)
  showFavorites: true,
} as const
```

---

## 3. Quais Recursos Foram Ocultados Temporariamente

1. **Header Desktop, Sticky e Mobile:**
   - Botão e ícone do carrinho e badge de contagem de itens (`showCommerceActions: false`);
   - Botão de Minha Conta / Login ativo (`showCustomerAccount: true` — permite à equipe acessar o Medusa Admin em `/app` e aos clientes gerenciarem a conta);
   - Botão de Favoritos ativo (`showFavorites: true` — permite aos usuários salvarem produtos do catálogo para consulta posterior);
   - Componente "Informe seu CEP / Calcule a entrega" (`showDeliveryEstimate: false`);
   - Link para Central de Ajuda no Header e TopBar (`showHelpCenter: false`).

2. **Footer (Rodapé):**
   - Links de "Fazer login", "Criar conta", "Minha conta" e "Produtos salvos" ativos (`active: true` em `footerNavigation.account`);
   - "Meus pedidos" mantido inativo temporariamente (`active: false`);
   - Link de "Carrinho" mantido inativo temporariamente (`active: false` em `footerNavigation.products`);
   - Link de "Central de Ajuda" mantido inativo temporariamente (`active: false` em `footerNavigation.support`);
   - Área de formas de pagamento online (Pix, Visa, Mastercard) (`showCommerceFooter: false`);
   - Aviso de "Preços e condições exclusivos para internet" (`showCommerceFooter: false`);
   - As colunas estruturam-se harmonicamente com Logo institucional, Produtos, Institucional, Atendimento e Políticas e Minha Conta.

3. **Carrinho Flutuante e Drawer Global:**
   - Botão flutuante do carrinho em `FloatingActions.tsx` não é renderizado (`showCommerceActions: false`);
   - Consulta `useCart` é mantida desativada (`enabled: false`) evitando requisições HTTP desnecessárias;
   - `<CartDropdown />` não é montado no DOM em `public-layout.tsx`;
   - O botão "Voltar ao topo" e o botão flutuante de WhatsApp permanecem ativos.

4. **Produtos e Catálogo:**
   - Referências de parcelamento online ("No Pix ou 10x de R$...") ocultadas no Card (`showCommerceActions: false`);
   - Botão de favoritos ocultado no Card e no PDP (`showFavorites: false`);
   - Botão de compra direta e consulta direcionados exclusivamente para WhatsApp com SKU, título e URL do produto;
   - Preços oficiais do catálogo continuam visíveis; produtos sob cotação continuam como "Sob cotação" ou "Consulte o valor".

5. **Proteção de Rotas de Compra:**
   - As rotas `/cart`, `/$countryCode/cart`, `/checkout` e `/$countryCode/checkout` redirecionam automaticamente para o catálogo (`/$countryCode/store`) via TanStack Router enquanto `showCommerceActions` for `false`.

---

## 4. Como Reativar o Marketplace Gradualmente

Para reativar as funcionalidades do marketplace sem necessidade de recodificação:

### Passo 1 — Reativar Feature Flags
Abra `apps/storefront/src/config/site-features.ts` e altere as flags desejadas para `true`:
- `showCommerceActions: true` (reativa botão de carrinho, drawer global, rotas `/cart` e `/checkout`);
- `showCustomerAccount: true` (reativa login, cadastro e link de conta no Header e Footer);
- `showFavorites: true` (reativa ícones e lista de favoritos);
- `showCommerceFooter: true` (reativa formas de pagamento online e avisos de compras online no rodapé);
- `showDeliveryEstimate: true` (reativa estimativa de CEP no Header);
- `showHelpCenter: true` (reativa Central de Ajuda na navegação pública);
- `showHeaderProductNavigation: true` (reativa Megamenu de produtos no Header);
- `showHomeProductShowcase: true` (reativa vitrines de produtos na Home);
- `showHomeCategories: true` (reativa carrossel de categorias na Home);
- `showHomeBenefits: true` (reativa benefícios comerciais na Home);
- `institutionalHome: false` (se desejar desativar o modo de apresentação institucional da Home).

### Passo 2 — Reativar Links no Footer
Em `apps/storefront/src/config/footer-navigation.ts`, defina `active: true` para os itens desejados:
- `login`, `register`, `my-account`, `orders` no array `account`;
- `cart` no array `products`;
- `help` no array `support`.

### Passo 3 — Executar Verificações Técnicas
Antes do relançamento, execute a suíte completa de testes:
```bash
pnpm --filter storefront typecheck
pnpm --filter storefront lint
pnpm --filter storefront test
pnpm --filter storefront build
```

### Passo 4 — Deploy Controlado no WSL
Seguindo o fail-closed invariant em `AGENTS.md`:
```bash
git add .
git commit -m "feat(storefront): reativa marketplace comercial"
git push origin Maestro
# No WSL:
cd /home/srv/friggafrio/Maestro
git pull origin Maestro
pnpm source:sync:check -- --deploy
./deploy/wsl-deploy.sh
```

---

## 5. O que Permanece Preservado

- **Catálogo de Produtos:** Todas as rotas de produto (`/$countryCode/products/$handle`), categorias (`/$countryCode/categories/$handle`) e busca (`/$countryCode/store`) continuam intactas e funcionais.
- **Backend Medusa v2:** Entidades, preços, estoque Omie, fluxos de carrinho, workflows, pagamentos Mercado Pago e Stripe, autenticação e dados de pedidos não sofreram nenhuma alteração.
- **Integração WhatsApp:** Os links de compra direta via WhatsApp direcionam para o número oficial `+55 11 92139-6007`.
- **Acessibilidade & Responsividade:** Todas as diretrizes de acessibilidade (painel a11y, navegação por teclado, leitor de tela, VLibras) permanecem ativas e validadas.
