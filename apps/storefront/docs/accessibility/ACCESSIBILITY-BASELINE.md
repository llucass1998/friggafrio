# Accessibility Baseline Audit - FriggaFrio Storefront

## 1. Localização de Elementos
- layout público: `apps/storefront/src/routes/__root.tsx` e componentes em `apps/storefront/src/components/layout/`
- header completo / compacto: `apps/storefront/src/components/layout/nav/index.tsx`
- footer: `apps/storefront/src/components/layout/footer/index.tsx`
- carrinho flutuante: `apps/storefront/src/components/cart/cart-button.tsx` e drawer
- dialogs/drawers: Radix UI primitives.
- formulários: `apps/storefront/src/pages/auth/*.tsx`, `checkout` pages.

## 2. Recursos Existentes
- Radix UI primitives fornecem base sólida (foco, keyboard nav, ARIA básico).
- Tailwind CSS é usado para estilos.
- Hydration issues limitam o uso de `window`/`localStorage` direto.
- **Falta:** Componente central de acessibilidade.
- **Falta:** Skip links.
- **Falta:** Região `aria-live` global.
- **Falta:** Suporte oficial a VLibras integrado.
- **Falta:** Controle de redução de movimento e contraste.

## 3. Buscas Preliminares
- Uso extensivo de Tailwind (possível `outline-none` sem `:focus-visible`).
- Imagens: a serem verificadas se têm `alt` correto.
- ARIA: Falta de labels em alguns botões de ícone (ex: botões sociais).

## 4. Problemas Encontrados na Baseline
- Navegação por teclado: O foco pode se perder em modais complexos (embora Radix ajude muito, o carrinho precisa validação).
- Contraste: Textos secundários (ex: `text-gray-400`) podem falhar em WCAG AA contra fundos brancos/cinzas.
- SSR: `localStorage` não pode ser lido na montagem síncrona sem causar hydration mismatch. Precisamos de um provider que hidrate após a montagem.

## 5. Resultados
A baseline indica que o site é estruturalmente sólido graças ao TanStack Router e Radix UI, mas carece das ferramentas ativas de acessibilidade (painel, libras, contraste dinâmico, tamanho de texto) e ajustes finos de contraste/foco (outline) solicitados.
