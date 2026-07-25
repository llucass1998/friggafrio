# Baseline da Visibilidade dos Produtos

## 1. Produtos Encontrados no Banco (Criados pelo seed forçado anterior)
- **ID:** prod_01JMBZ1Y6Y0XQ9B8P6H8Z6Y6P4 | **Handle:** gas-r410a-chemours-3 | **Status:** published
- **ID:** prod_01JMBZ1Y7B5T88EQK7M547F538 | **Handle:** compressor-bitzer-3 | **Status:** published
- **ID:** prod_01JMBZ1Y7HRDBJ3C7ZBCS3K96V | **Handle:** manifold-testo-3 | **Status:** published
- **ID:** prod_01JMBZ1Y7MMNNT1QSK39F11DRW | **Handle:** evaporador-mipal-3 | **Status:** published

## 2. Problemas Identificados
- **Variantes:** Criadas, porém todas com `manage_inventory: false`.
- **Preços BRL:** Existentes.
- **Sales Channel:** Associados ao `sc_01JMBNB1QJ0QZTVC3F3PDKYQXY`.
- **Inventory Items:** Inexistentes. A relação `inventory_items` da variante no banco está vazia.
- **Inventory Levels:** Inexistentes. Nenhuma variante conectada a estoque real.
- **Categorias:** O array está `[]`.
- **Shipping Profile:** Aparentemente ausente na relação dos produtos (deveria estar linkado ao perfil Default).
- **Problema Root (Causa):** O script `force-products-seed.ts` foi usado como workaround desabilitando o `manage_inventory`. No script original `03032026-initial-seed.ts`, a linha que quebrava o processo era `variant.inventory_items[0]?.inventory_item_id`. Como a relação ModuleLink do Medusa v2 não retornava preenchida na hora exata pós-criação da variante no mesmo bloco síncrono da API local, a leitura lançava exceção `Cannot read properties of undefined (reading '0')`.

## 3. Estado Atual do Frontend
- Store API pode estar filtrando produtos por região sem associação.
- `FeaturedProducts.tsx` usa filtro `-created_at` e `region_id`.
- Faltam tratamentos seguros de nulos em vários pontos (ex: `variant.prices`).
