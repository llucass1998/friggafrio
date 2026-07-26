# Baseline e Fase 1~5 Completa

## Fases Concluídas
- [x] Baseline identificada.
- [x] Inventário atual executado. Todos os 40 produtos originais não batiam com a matriz ou estavam soltos/ocultos.
- [x] Os produtos incorretos foram ocultados através do workflow (`purchase_enabled: false`, `storefront_visible: false`).
- [x] Os 5 produtos autorizados reais foram devidamente criados, todos com opções e SKUs de Botija/Lata de acordo com a exigência estrita comercial do proprietário (inclusive `gas-r22-freon`, `gas-r134-freon`, `gas-r404-freon`, `gas-r410-freon`, `gas-r22-eos`).
- [x] Preços em BRL reais configurados.
- [x] Script de estoques rodado `repair-friggafrio-gas-inventory.ts`, definindo um Inventory Level padrão `50` para todos na Stock Location brasileira habilitando compras reais com estoque.

## Próximos Passos
- Investigar o SSR Hydration Mismatch na Home (`FeaturedProducts.tsx`).
- Centralizar o Auth/Medusa clients para garantir integração adequada sem Mismatch/Falso 500 no carrinho (criação via `add-to-cart`).
