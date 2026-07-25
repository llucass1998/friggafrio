# Correção do Isolamento do Footer

## Problema Encontrado
A seção "Produtos especializados FriggaFrio" estava invadindo ou encostando no footer sem um distanciamento adequado e isolamento semântico/estrutural.

## Causa Raiz
A seção de produtos não possuía espaçamento inferior adequado na própria home. Além disso, o footer não garantia visualmente e estruturalmente que ele começasse sempre de forma independente e destacada após o conteúdo principal. O `main` no `PublicLayout` não tinha garantias visuais adicionais no encerramento da página.

## Arquivos Afetados
- `apps/storefront/src/components/home/FeaturedProducts.tsx`
- `apps/storefront/src/components/public-footer.tsx`
- `apps/storefront/src/pages/public-home.tsx`

## Correção Aplicada
1. **FeaturedProducts.tsx**: A seção recebeu padding vertical ampliado (`py-10 md:py-16 lg:py-24`) e margin-bottom explícita (`mb-12 md:mb-20`) para não encostar na próxima área. O container manteve o `position: relative` com `flex-col` para gerenciar o layout de skeletons de loading de forma estável, sem margens negativas.
2. **public-footer.tsx**: O `<footer>` agora usa `relative w-full shrink-0` para garantir que ele respeita o fluxo de bloco e não sobrepõe conteúdo, além de adotar uma borda superior discreta e amigável ao design system (`border-t-[8px] border-[#bae6fd]`) para separação estrita da área branca principal.

## Como evitar regressão
Sempre utilize margin/padding em seções (e.g. `mb-*`, `pb-*`) dentro dos componentes da página para definir o final da home, e não margens negativas ou `absolute` para esconder componentes. O footer precisa ser mantido com `shrink-0` no flexbox global do Layout.

## Resoluções Testadas
Desktop (1024+, 1366, 1440), Tablet (768) e Mobile (320, 360, 390).
