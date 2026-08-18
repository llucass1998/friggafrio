# FriggaFrio - Pre-Gate-8 Definitive Stabilization Checkpoint

Audit date: 2026-08-15 (America/Sao_Paulo)
Branch: `Maestro`
HEAD baseline: `3c53856cfa12648ab72509d72aa99c86ee8d5238`

## Formal state

- Gate 7: PASS
- Formal progress: 7/14
- Gate 8: READY_TO_START
- Gate 8 started: NO
- Payment integration: not started

## Stage 0 evidence

- Canonical worktree verified as `C:/Users/lluca/orca/workspaces/projeto friggagafrio/Maestro`.
- No staged changes were present; pre-existing unstaged work was preserved.
- `git diff --check`: PASS.
- Docker Desktop and the canonical stack were recovered without resetting volumes: PostgreSQL `127.0.0.1:55432`, Redis `127.0.0.1:56379`, Medusa `:9000`, and storefront `:5173` are listening.
- The missing Medusa PostgreSQL locking table was created by the official safe migration (`public.locking` now exists). No inventory or product data was rewritten.

## Catalog and taxonomy (read-only)

Source: `docs/audit/MAESTRO-TAXONOMY-DRY-RUN-2026-08-15.md`.

- Medusa products: 1,080 active published; inactive: 0.
- Live variants: 1,080; one variant per product; no orphan variants.
- Categories: 16 top-level; product/category relations: 1,080.
- Active products categorized: 1,080/1,080; uncategorized: 0.
- Omie discovery: 1,229 records (1,080 active, 149 inactive), with six family groups and no duplicate external IDs/SKUs.
- Commercial states observed: 327 SELLABLE, 737 OUT_OF_STOCK, 16 PRICE_PENDING, 0 QUOTE_ONLY.
- Deterministic proposal: family-code/name fallback with `sem-familia` quarantine; explicit review required for 100 unknown-family active records and four asset/third-party records.

Live Store API category filtering returned HTTP 200 for all 16 categories; counts matched returned products and empty categories remained empty (no all-products fallback).

Result: live taxonomy persistence and server-side category filtering are present. The continuation evidence below supersedes the initial read-only checklist; the remaining definitive blocker is the missing browser Google Maps credential.

## Already implemented in the current worktree

- Storefront mega-menu now consumes Medusa category data instead of the hardcoded category tree.
- Added real category listing and category-handle routes under `/$countryCode/categories`.
- Featured-category cards and the all-categories CTA point to category routes/listing.
- The all-products CTA points to `/$countryCode/store`.
- Store search state preserves category filters in the URL.
- Category product loader sends a server-side `category_id` filter.
- Store loader query key now includes `category` and option filters, preventing reuse of an unfiltered SSR snapshot during category navigation.
- Storefront typecheck after the query-key fix: PASS.
- Category pages now reuse `PublicProductCard` with responsive 4/3/2/1 columns, bounded images, Portuguese count copy, and category pagination (24 products/page).
- PDP SELLABLE CTA now says `Adicionar ao carrinho`, includes integer quantity controls bounded by available inventory, and hides the quote action for normal SELLABLE products.
- `useAddToCart` now invalidates all cart query variants; default cart fields include `*items` and `*promotions`, preventing an empty/stale cart UI when the server line exists.
- `CartPromo` tolerates absent promotions and no longer throws an Error Boundary on a normal cart response.
- Featured categories use persisted `metadata.featured === true` data in a keyboard-accessible horizontal carousel with reduced-motion support.

## Historical checklist (superseded by continuation evidence below)

- Semantic review of the 16 persisted categories (notably the large `Outros` bucket) and explicit parent/child hierarchy if the canonical data supports it.
- Idempotent apply and second-run proof.
- 100% category route/filter matrix, parent/child semantics, and cross-category contamination proof.
- Featured category carousel visual/touch/keyboard evidence at 390px, 768px, and desktop widths.
- Deterministic pagination/SSR hydration proof and real reproduction check for the reported 4-to-12 jump.
- Three-product add-to-cart matrix across categories and quantity guard checks (completed in continuation evidence below).
- Live localhost/browser hard-refresh/back-forward checks and full category matrix evidence (category and cart happy paths completed; checkout address/delivery remains a final QA item).
- Browser Google Maps credential (`VITE_GOOGLE_MAPS_EMBED_API_KEY`) is not configured; the page currently provides a verified Google Maps deep-link fallback, but an interactive embedded map cannot be declared PASS without the browser credential.
- Independent category QA, live browser QA, and final adversarial QA (workers are being completed in this continuation).
- Full backend/storefront test matrix, secret scan, and final documentation update after implementation.

## Current recommendation

`PRE_GATE_8_DEFINITIVE_STABILIZATION_OPEN`

Do not create the final commit and do not start Gate 8 until the database/runtime is available and the missing stages above are completed with real browser evidence.

## Checks executed in this checkpoint

- Backend TypeScript: PASS.
- Backend unit tests: 21 suites / 147 tests PASS.
- Storefront TypeScript: PASS.
- Storefront unit tests: 65 tests PASS.
- Storefront ESLint: PASS (63 pre-existing warnings, 0 errors).
- Secret scan: PASS (historical expired-secret warning only; no tracked/untracked current secret findings).
- `git diff --check`: PASS.

## Delegation checkpoint

- Catalog Taxonomy Backend Agent: `DELEGATED_AND_EXECUTED`; read-only report accepted.
- Category Relation Backend Agent: `DELEGATED`; stopped as `STALLED/BLOCKED` after the runtime remained unavailable and no relation evidence or safe apply could be produced. No files or database rows were changed by that worker.

## Continuation evidence (2026-08-15)

- Canonical runtime was recovered without touching PostgreSQL/Redis volumes. Backend `:9000` and storefront `:5173` were revalidated after a transient backend process exit.
- Category product requests now include inventory projection fields. This removed the category-card false `Sem estoque` state for sellable products when the category route had omitted those fields.
- `/br/store` SSR and first client render are deterministic at 24 products; the previously observed 4-to-12 jump was not reproduced. First-page IDs remain unique and stable after hydration.
- Real browser QA verified 16/16 category routes with server-side filters, empty categories without catalog fallback, featured categories count `7`, and responsive category grids at 390px, 768px, and 1440px without horizontal overflow.
- Real sellable add-to-cart was verified for the fixture SKU `1988730838` and three category samples. The cart line was persisted server-side, remained after reload, and checkout navigation was enabled with zero unexpected network responses or runtime errors in the happy path.
- Cart UI was corrected to Portuguese BR. Cart fields now explicitly request `+currency_code`; the cart displays the real line price/subtotal and no longer shows the false `Sem estoque disponível` message when Medusa omits `inventory_quantity` but the reconciled product metadata contains `inventory_quantity_observed` and `commercial_status: SELLABLE`.
- The storefront cart-state unit suite now covers reconciled inventory metadata and explicit `OUT_OF_STOCK` metadata. Storefront unit tests: 65/65 PASS; storefront typecheck: PASS.
- The checkout route hard-refresh rendered the real address step at `/br/checkout?step=addresses`; payment remains disabled. A complete address/delivery submission was not used to invent a payment result.
- Maps/Store Location QA confirmed the single commercial location and shipping origin (`Alameda Glete, 663`, CEP `01215-001`) agree. The stale unverified Place ID was removed; `Abrir no Google Maps` and `Como chegar` now resolve with the canonical address and external route validation passed with zero page/network errors.

## Remaining blockers for definitive PASS

- Interactive Google Maps remains unavailable because `VITE_GOOGLE_MAPS_EMBED_API_KEY` is not configured. The verified commercial location and address-based Google Maps fallbacks are present, but the prompt explicitly requires a real interactive map; no credential was invented or exposed.
- Final adversarial QA was re-executed read-only after the storefront fixes. Home sellability, carousel controls, mobile links, cart persistence, checkout address navigation, 16 category routes, responsive widths, and happy-path network/console checks passed. It identified equal-`created_at` pagination overlap, which was corrected by the total `id` ordering documented above.
- The full backend/storefront build, typecheck, unit/HTTP integration, lint, security scan, and browser smoke pass are complete. The untracked `runtime-logs/` directory remains runtime-owned and must be cleaned only after stopping the local services. No commit or push is authorized while the Maps credential blocker remains.

## Continuation evidence (2026-08-16)

- Canonical storefront category handles were revalidated against the live Medusa catalog. Hero carousel links now resolve to `tubos-de-cobre`, `ferramentas-manuais`, `isolamento-termico`, `recolhedoras`, and `gases-refrigerantes`; all returned HTTP 200 with non-empty category results.
- The mobile navigation fallback now uses the 16 persisted Medusa categories. Every mobile category link returned HTTP 200 in a real browser; synthetic legacy slugs are no longer emitted.
- Featured-category carousel previous/next controls were exercised in a real browser; the next control moved the scroll track from `0` to `256` pixels. Keyboard navigation remains enabled.
- Home specialized products now request explicit inventory/commercial fields, scan the recent catalog window, and display four real `SELLABLE` products instead of the newest out-of-stock rows. Browser evidence showed prices, `Adicionar ao carrinho`, and fixture SKUs `5576058124`, `5574618758`, `5574624787`, and `5572869084`.
- Catalog deep links now honor `?page=N` server-side and hydrate the same page client-side. Browser checks for pages 1, 2, and 3 returned 24 distinct product IDs per page with no unexpected responses.
- Catalog and category pagination now use a total Medusa ID ordering (`-id` for the catalog and `id` for category pages). This removes the equal-`created_at` offset overlap observed in adversarial QA; pages 1/2 and 2/3 now have zero shared product IDs.
- The normal SELLABLE cart no longer presents a prominent quote action; `Solicitar orçamento` is rendered only when the cart contains a `QUOTE_ONLY` line. Singular cart copy is now grammatically correct (`1 item pronto`).
- Latest storefront validation: typecheck PASS, unit tests 65/65 PASS, build client/SSR PASS, lint 0 errors / 62 warnings, and `git diff --check` PASS.

These results close the previously identified hero-link, mobile-navigation, Home sellability, and catalog deep-pagination regressions. The final independent QA also passed those flows. The stabilization remains OPEN solely because the required browser Google Maps credential is absent.

## Product experience redesign evidence (2026-08-16)

- `PublicProductCard` is the shared storefront card for Home, category, and all-products surfaces. The legacy `ProductCard` remains unused by these routes and was not allowed to introduce a second visual system.
- Product image areas now use a bounded 4:3 ratio with compact fallback treatment; title lines are clamped; SKU is secondary; price and commercial state are explicit; technical `Equipment` badges and fake payment claims are absent.
- Product grids now use `2 columns` on small screens, `3` at `sm`, `4` at `lg`, and `5` at `2xl` where the container allows. Card heights are uniform per grid (desktop measured `491px`, mobile `478px` in the live browser), with no CTA wrapping or layout shift.
- Home, `/br/store`, and `/br/categories/bombas-de-vacuo` were rendered at `1440`, `1280`, `768`, and `390` widths on `http://localhost:5173`; body width matched the viewport, cards rendered consistently, and browser console/network errors were zero.
- PDP gallery now follows the same 4:3 bounded image language and the information column starts at the top of the grid. CTA remains `Adicionar ao carrinho`; no fake Pix, installment, discount, rating, or quote action is rendered for normal SELLABLE products.
- Product titles containing HTML entities are decoded for card, PDP, and cart presentation (`10&quot;` now renders as `10\"`). Home no longer marks every product as `Novo`; the badge is only eligible when supplied by real metadata.
- Three real SELLABLE products (`5576058124`, `5574618758`, `5574624787`) passed PDP state/price checks, enabled CTA checks, successful real add-to-cart, cart line persistence, cart UI rendering, and hard-refresh persistence in one browser context.
- Catalog pages 1/2/3 remained deterministic at 24 products each with zero overlapping IDs. Featured category carousel moved `scrollLeft` `0 -> 256` and returned via keyboard navigation; seven real featured links were present.
- Storefront typecheck, unit tests (`65/65`), lint (`0 errors / 62 warnings`), client/SSR build, backend typecheck, backend unit (`147/147`), backend HTTP integration (`4/4`), backend build, secret scan, and `git diff --check` all passed.
- The in-app browser runtime was unavailable in this execution (`browsers.list() = []`); Playwright `1.62.0` was used locally against `http://localhost:5173` for the recorded live evidence. This does not close the explicit Maps credential blocker.
- Independent final adversarial QA after the redesign confirmed no false `Novo`/`Equipment` badges, compact card measurements (`171x478` at 390px, `220x491` in the catalog at 1440px), 16/16 category routes, zero pagination overlap, 3/3 real add-to-cart successes, cart persistence after reload, and zero unexpected console/network errors. It independently reproduced the same Maps-only blocker (`iframe = 0`, browser credential absent).
