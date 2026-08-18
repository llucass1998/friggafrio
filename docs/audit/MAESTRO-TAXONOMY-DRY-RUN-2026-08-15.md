# Maestro Taxonomy Dry-Run (read-only)

Audit date: 2026-08-15 (America/Sao_Paulo)

Scope: canonical Maestro worktree, live Medusa PostgreSQL database, current Omie `ListarProdutos` feed, storefront/category implementations, and historical catalog artifacts. No Medusa/Omie writes, file edits to application code, stock/price/shipping/checkout/payment changes, commit, push, reset, or clean were performed.

## Evidence and method

- Medusa SQL read-only queries against `product`, `product_variant`, `product_category`, and `product_category_product` using the local `DATABASE_URL`.
- Omie read-only `ListarProdutos` through `OmieCatalogReader`/`OmieClient` in `apps/backend/src/integrations/omie/`; 13 pages at page size 100.
- Static inspection of `apps/backend/src/integrations/omie/mapper.ts`, `apps/backend/src/integrations/omie/types.ts`, storefront navigation/category loaders, and historical docs/snapshots.
- Existing historical evidence: `docs/maestro/PHASE-05-OMIE-DISCOVERY.md`, `apps/backend/docs/omie/GATE-5-CANDIDATE-MANIFEST.json`, and `docs/catalog/audit-results.json`.

## Current Medusa catalog

| Metric | Count | Notes |
| --- | ---: | --- |
| Products (all) | 1,080 | `deleted_at IS NULL`: 1,080; deleted: 0 |
| Products active | 1,080 | All `status = published` |
| Products inactive | 0 | No draft/rejected/soft-deleted rows |
| Variants (all/live) | 1,080 / 1,080 | Deleted variants: 0 |
| Variants per product | 1 each | 1,080 products with one live variant; no orphans |
| Products categorized | 0 | No rows in `product_category_product` |
| Products uncategorized | 1,080 | 100% of live products |
| Product/category relations | 0 | Relation rows: 0; related products: 0; related categories: 0 |
| Categories (all/live) | 0 / 0 | Soft-deleted categories: 0 |
| Top-level categories | 0 | `parent_category_id IS NULL` |
| Subcategories | 0 | `parent_category_id IS NOT NULL` |
| Empty categories | 0 | No category rows exist |
| Product counts per category | none | No category can currently return products |

Medusa metadata identity checks:

- `metadata.source = "omie"`: 1,080/1,080.
- `metadata.omie_external_id`: 1,080/1,080; duplicate external-id groups: 0.
- `metadata.omie_fingerprint`: 1,080/1,080.
- Taxonomy metadata (`category` or `family` keys): 0/1,080.
- Variant SKU duplicates: 0; products without a live variant: 0.

Current commercial metadata (observed only, not changed): 737 `OUT_OF_STOCK`, 327 `SELLABLE`, and 16 `PRICE_PENDING`; all 1,080 currently carry `product_sales_policy = DIRECT`, `storefront_visible = true`, and `purchase_enabled = true`.

## Omie source taxonomy fields

Read-only discovery returned 1,229 records across 13 pages:

- Active: 1,080
- Inactive: 149 (not projected into Medusa)
- Omie category fields (`categoria`, `categoria_nome`, `category`) populated: **0** records.
- Normalized `product.category` produced by the current mapper: **0** records.
- Family fields are present as `codigo_familia`/`descricao_familia` and form six observed combinations:

| Family code/name | Total | Active | Inactive | Proposed stable slug |
| --- | ---: | ---: | ---: | --- |
| `1999649027 | Materiais para revenda` | 567 | 463 | 104 | `materiais-para-revenda` |
| `1999649914 | Uso e consumo` | 462 | 456 | 6 | `uso-e-consumo` |
| `0 | -` (missing/unknown family) | 139 | 100 | 39 | `sem-familia` (quarantine) |
| `5569361363 | Materiais Revenda (Gas / Cobre)` | 57 | 57 | 0 | `materiais-revenda-gas-cobre` |
| `1999649800 | Ativo imobilizado` | 2 | 2 | 0 | `ativo-imobilizado` (review) |
| `2053012087 | Bens de Terceiros` | 2 | 2 | 0 | `bens-de-terceiros` (review) |
| **Total** | **1,229** | **1,080** | **149** | |

The current mapper only reads category aliases (`categoria`, `categoria_nome`, `category`) and does not project Omie family fields; this is why Medusa has no taxonomy metadata even though family data is present upstream.

## Deterministic mapping proposal (dry-run only)

1. Preserve a stable source identity first: `omie_external_id` + primary SKU. Existing identity coverage is complete and conflict-free (1,080/1,080; no duplicates).
2. Normalize a populated Omie category field when present. Current feed has none, so this branch maps zero rows today.
3. Fallback to the exact pair `codigo_familia + descricao_familia`; create one Medusa top-level category per table above using the proposed slug. Preserve the raw code/name in metadata (`omie_family_code`, `omie_family_name`) and never overwrite the operational Omie fields.
4. Route code `0`/blank to `sem-familia` quarantine. Do not infer a sellable category from free-text titles without a reviewed controlled vocabulary.
5. Do not auto-create subcategories in this run. A subcategory requires an explicit approved dimension (for example refrigerant type, compressor technology, or tool type); title heuristics remain a review queue, not an import rule.
6. Keep category assignment idempotent by `(source, family code, normalized name)` and fail closed on code/name drift, slug collisions, or ambiguous external-id/SKU matches.

Expected active product distribution if family fallback is approved: 463 `materiais-para-revenda`, 456 `uso-e-consumo`, 100 `sem-familia` quarantine, 57 `materiais-revenda-gas-cobre`, 2 `ativo-imobilizado` review, and 2 `bens-de-terceiros` review.

## Conflicts and gaps

- **No Medusa taxonomy exists:** 1,080 published products are 100% uncategorized; category navigation/API pages cannot return product/category relations.
- **Source category is absent:** all 1,229 Omie records lack category aliases; family fallback is necessary and is semantically coarser than a merchandising taxonomy.
- **Unknown family queue:** 100 active records have family code `0`/blank and must remain quarantined until business classification.
- **Out-of-scope family review:** 4 active records are `Ativo imobilizado` or `Bens de Terceiros`; do not expose them as ordinary resale categories without approval.
- **Static navigation mismatch:** `apps/storefront/src/components/header/categories.ts` hardcodes four product parents plus children and mixes `category=`, free-text `q=`, and `aplicacao=` links; none map to current Medusa category IDs (which are absent).
- **Historical snapshot mismatch:** `docs/catalog/audit-results.json` describes an older 88-product/15-category dataset and must not be used as current catalog truth.

## Reusable vs obsolete artifacts

| Artifact | Classification | Rationale |
| --- | --- | --- |
| `apps/backend/src/integrations/omie/client.ts`, `reader.ts`, `reconciliation.ts` | Reusable | Read-only pagination, stable identity matching, dry-run conflict semantics, and idempotent reconciliation are the correct integration foundation. |
| `apps/backend/src/integrations/omie/mapper.ts` and `types.ts` | Reusable with extension | Keep normalization, but add explicit family-code/name fields and raw taxonomy preservation; current category aliases are empty in the feed. |
| `apps/backend/src/scripts/omie-gate5-discovery.ts` | Reusable | Provides the complete 13-page read-only discovery path used by this audit. |
| `docs/maestro/PHASE-05-OMIE-DISCOVERY.md` and `apps/backend/docs/omie/GATE-5-CANDIDATE-MANIFEST.json` | Reusable governance evidence | Source-of-truth, dry-run, and no-Omie-write decisions remain valid; taxonomy values should be regenerated from the live feed. |
| `docs/catalog/COMMERCIAL-CATALOG-MANIFEST.example.json` | Reusable schema template only | Safe shape for approval metadata; `expectedProductCount: 5` and empty products are not current catalog data. |
| `apps/storefront/src/components/header/categories.ts` | Obsolete as canonical taxonomy; reusable as UX hints | Hardcoded labels/query links have no Medusa IDs and include non-taxonomy application filters. |
| `docs/catalog/audit-results.json` | Obsolete snapshot | 88 products, 105 variants, and 15 top-level categories conflict with the live 1,080-product/zero-category database. |
| Historical `apps/storefront/src/data/demo/categories.ts` (deleted) | Obsolete demo | Initial five static categories (`gases`, `compressores`, `câmaras`, `ferramentas`, `componentes`) were demo-only and are not persisted. |
| `docs/catalog/PRODUCTS-WITHOUT-IMAGES-CHECKLIST.md` and `docs/catalog/DEMO-CATALOG-*` | Historical planning | Claims of nine technical categories/demo seed are not evidenced by current DB rows; retain only as context. |

## Recommended next gate

Approve the six family-level top-level categories and the quarantine policy, then run a second dry-run that adds family metadata and proposes reviewed subcategories. Do not apply category writes until the 100 unknown-family products and the four asset/third-party products are explicitly classified.

## Runtime recheck (same date)

The zero-category figures above are the original dry-run snapshot captured while PostgreSQL was unavailable. After the canonical Docker stack was recovered, the live Medusa database contained 16 top-level categories, 1,080 product/category relations, and 1,080/1,080 active products categorized. Store API category filters returned HTTP 200 for all 16 categories with matching counts, including correctly empty categories. The persisted rows currently carry deterministic title-taxonomy metadata and still require semantic review of the large `Outros` bucket plus an idempotency proof before final acceptance.
