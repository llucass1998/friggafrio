━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 0, 1, 2 e 3
STATUS: APROVADA

OBJETIVO: Identificar a raiz do bloqueio de preço ("Consulte o valor") e do impedimento de compras ("Indisponível"), bem como fixar o formato pt-BR/BRL em toda a storefront.
PRODUTOS ANALISADOS: Todo o ecossistema que transita por `PublicProductCard` (Listagem, Featured, Search).
PREÇOS ENCONTRADOS: Identificado o problema que derruba os preços reais: o template original do SDK e as Utils de formatação mantiveram default keys de `dk` (Dinamarca) e a currency base em `DKK`.
PREÇOS APROVADOS: A UI tem uma camada estrita para metadados `is_demo_price` e `price_approval_status === "pending"`.
CAUSA DO “CONSULTE O VALOR”: O Medusa Backend recusa emitir os blocos de `calculated_price` quando a API do storefront solicita sem uma ID de região correta. A UI cata rigidamente a `variants[0]` vazia e joga para fallback.
CAUSA DO “INDISPONÍVEL”: Regras redundantes de frontend checando flag de demo e inventário zerado. Se o produto não tiver o bloco de `calculated_amount` ele não cai na variante comprável.

CORREÇÕES QUE FAREI AGORA:
- Mudar `dk` para `br` em `region.ts` e `currency.ts`.
- Mudar o hardcoded fallbacks de DKK.
- Modificar o selector tipado para testar corretamente se um produto pode ser comprado (Fase 4).
- Ajustar os formattadores de moeda e reescrever a `PublicProductCard`.

CARRINHO: Arquitetura analisada, usarei a função `addToCart` em conjunto com a mutation correta para puxar o Drawer.
TESTES: Nenhuma quebra.
PRÓXIMA FASE: Aplicar Fase 4 e Fase 5.