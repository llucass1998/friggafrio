# FriggaFrio - Phase 6 Preparation

Status: READY TO START. Gate 6 has not started formally; this document remains technical preparation only.

## Gate inheritance

- Gate 1: PASS
- Gate 2: PASS
- Gate 3: PASS
- Gate 4: PASS
- Gate 5: OPEN - external Omie blocker (`OMIE_APP_KEY` and `OMIE_APP_SECRET`)
- Formal gates: `5/14`
- Omie blocker: `DEFERRED` for this preparation run

No catalog, price, inventory, stock location, shipping profile, shipping option,
or other commercial data was created.

## Cart architecture

The storefront already uses Medusa V2 Store APIs (Medusa `2.18.0`) through the
SDK. The request path is:

`Storefront -> Medusa Store API -> PostgreSQL`

There is no Storefront-to-Omie dependency.

Implemented entry points:

- `apps/storefront/src/lib/data/cart.ts`: create/retrieve/update cart, add/update/delete line items, and promotions.
- `apps/storefront/src/lib/hooks/use-cart.ts`: React Query mutations and optimistic updates.
- `apps/storefront/src/lib/utils/cart.ts`: local cart id, optimistic cart projection, line-item helpers.
- `apps/storefront/src/components/cart.tsx`: drawer, empty state, line items, totals, and quantity controls.
- `apps/storefront/src/pages/cart.tsx`: cart page and checkout navigation.
- `apps/storefront/src/lib/utils/region.ts`: country-scoped region resolution; Brazil is the supported commerce country.

Contract for the next formal phase:

- create/retrieve cart using the Brazil region and BRL currency;
- add, update, and remove variants using server-side Medusa variant ids;
- treat quantity as a positive integer and let Medusa remain the pricing and inventory authority;
- never accept browser-provided price, inventory, or shipping totals as authoritative;
- preserve cart ownership through Medusa's cart token/session behavior.

Current classifications:

- Cart API integration: `READY`
- BRL/Brazil region selection: `READY`
- Quantity validation before request: `PARTIAL` (server remains authoritative; client helpers do not consistently reject all invalid quantities)
- Concurrent update/overselling proof: `BLOCKED_BY_GATE_5`
- Real sellable variant coverage: `BLOCKED_BY_GATE_5`

## Inventory and sellability boundary

The storefront previously converted missing inventory metadata into a purchasable
state. That bypass is removed.

Current policy in `apps/storefront/src/lib/utils/product.ts` and
`apps/storefront/src/lib/utils/product-state.ts`:

- `manage_inventory: true` requires a numeric quantity greater than zero;
- `manage_inventory: false` is available without a quantity;
- `allow_backorder: true` is an explicit availability override;
- missing inventory metadata is unknown and therefore not purchasable;
- missing or non-positive price is `price_pending`;
- `is_quote_only: true` or `commercial_status: "QUOTE_ONLY"` is unavailable for direct purchase.

This is a technical policy only. It does not create or approve catalog data.

## Shipping architecture

The storefront uses the Medusa V2 fulfillment/store APIs:

- `sdk.store.fulfillment.listCartOptions({ cart_id })` to discover options;
- `sdk.store.fulfillment.calculate(option_id, { cart_id, data })` for calculated prices;
- `sdk.store.cart.addShippingMethod(cart_id, { option_id, data })` to attach a method.

Relevant files:

- `apps/storefront/src/lib/data/checkout/shipping.ts`
- `apps/storefront/src/lib/hooks/use-checkout.ts`
- `apps/storefront/src/components/checkout-delivery-step.tsx`
- `apps/storefront/src/components/shipping-item-selector.tsx`

The UI auto-selects the first returned option, disables calculated options until
calculation resolves, and prevents advancing without a selected option. Empty
and provider-failure states still need a formal Gate 6 test and a dedicated
user-facing error state.

Backend custom order shipping routes also exist:

- `apps/backend/src/api/store/customers/me/orders/[id]/shipping-options/route.ts`
- `apps/backend/src/api/store/customers/me/orders/[id]/shipping-method/route.ts`

These routes are not the storefront cart flow. Their current global option query,
lack of explicit service-zone/sales-channel validation, and fallback to amount
`0` when a currency price is absent classify them as `LEGACY`/`INVALID` for
production shipping until they are either retired or redesigned against the
Medusa V2 fulfillment model.

Commercial fulfillment data is not present:

- Stock Locations: `0`
- No approved shipping profile
- No approved service zone/fulfillment set
- No approved shipping option or provider rule

Therefore shipping remains `BLOCKED_BY_GATE_5` and no commercial shipping data
was fabricated.

## Dependency graph

`PRODUCT -> VARIANT -> PRICE -> INVENTORY ITEM -> INVENTORY LEVEL -> STOCK LOCATION -> FULFILLMENT SET -> SERVICE ZONE -> SHIPPING OPTION -> CART -> SHIPPING METHOD`

The first four catalog/inventory links cannot be proven until the Omie manifest
is approved and imported. Stock location, fulfillment set, service zone, and
shipping option also require a business-approved shipping design for gases and
refrigeration products. The cart API itself is implemented, but end-to-end
sellability is `BLOCKED_BY_GATE_5`.

## Security review

- Cart and line-item mutations send variant ids and quantities; browser prices are not sent as authority.
- Optimistic prices are display-only and must be replaced by the Medusa response after mutation.
- The quote workflow now filters the cart by both `cart_id` and authenticated `customer_id`, closing the identified cross-customer cart/quote access path.
- Quantity manipulation, stale carts, simultaneous updates, and inventory races require server-backed tests after real inventory exists.
- The custom order shipping routes require a separate authorization and fulfillment-scope hardening pass before production use.
- No Omie credential, token, or secret was read or changed in this preparation run.

## Test plan for formal Gate 6

Technical fixtures may be synthetic and must remain clearly labelled as fixtures;
they must not be imported as catalog data.

Cart tests:

- create/retrieve cart in Brazil with BRL;
- add, update, and remove line items;
- invalid or inactive variant;
- `QUOTE_ONLY`, missing price, unknown inventory, zero inventory, and insufficient inventory;
- zero, negative, fractional, and excessive quantities;
- duplicate add and concurrent update behavior;
- stale cart and PostgreSQL/Redis failure handling.

Shipping tests:

- no shipping option;
- invalid option id;
- service-zone and stock-location mismatch;
- quote-only item;
- calculated-price/provider failure;
- unavailable fulfillment provider;
- shipping method ownership and cart/region/sales-channel scope.

Storefront checks:

- cart drawer/page, empty state, loading, retry, errors, and mobile quantity controls;
- BRL display and server-refreshed totals;
- CEP/address step and delivery-option empty/failure states;
- no direct Omie dependency.

## Work executable after Gate 5

1. Approve the real Omie candidate manifest.
2. Import only approved products, variants, prices, inventory, and categories through the dry-run/approval flow.
3. Create or map a real stock location and fulfillment/shipping configuration.
4. Run the cart and shipping integration suite against PostgreSQL-backed Medusa.
5. Prove quote-only behavior, inventory boundaries, idempotency, and concurrency.

Checkout completion and payment remain explicitly out of scope for this
preparation; they belong to Phases 7 and 8.

## Changes made in this preparation

- Closed the missing-inventory-to-purchasable bypass in storefront product state.
- Added explicit `QUOTE_ONLY`, positive-price, zero-stock, unknown-stock, and backorder unit coverage in `apps/storefront/tests/unit/product-state.test.mjs`.
- Added authenticated customer ownership filtering to the request-for-quote workflow.

No formal gate was incremented. Gate 5 remains open.
