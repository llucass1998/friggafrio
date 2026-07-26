# Real Catalog Homologation

## Escopo (Fase 12)
O sistema deve apresentar SOMENTE produtos e SKUs do portfólio oficial homologado da FriggaFrio para o MVP de Vendas de Gases.
- Gás R22 Freon — Botija e Lata.
- Gás R134 Freon — Botija e Lata.
- Gás R404 Freon — Botija e Lata.
- Gás R410 Freon — Botija e Lata.
- Gás R22 EOS — Botija e Lata.

## Regras 
1. **Nada Fake**: Sem dados inventados de preços, SKUs, pesos, dimensões, NCM, CEST ou descrições técnicas abstratas. Os valores devem corresponder com exatidão ao banco de dados contábil/estoque real. 
2. **Produtos Incompletos**: Variantes incompletas não devem ser comercializáveis diretamente via checkout se não puderem ser medidas, caindo na lógica de Solicitação de Orçamento (Quote).
3. **Migração Segura (Idempotente)**: Os produtos devem ser criados ou atualizados unicamente por script.
   - O script `repair-friggafrio-sellable-catalog.ts` deve operar via `dry-run` por padrão.
   - Produtos mock/lixo das primeiras versões do framework (Medusa Starter Seed) devem ser desativados (`status: "draft"` ou `"rejected"`), e ocultos das vitrines, para não quebrar orders de dev/homologação já testadas que apontam pra eles.

## Execução
O script deverá processar as atualizações validando:
- Product Handles
- Categorias
- Tags
- Títulos Oficiais
