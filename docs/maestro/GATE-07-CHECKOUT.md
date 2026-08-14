# FriggaFrio Gate 7 - Checkout

Status: PASS (2026-08-14)

## Boundary

Gate 7 prepares a valid cart for payment without processing payment or
creating an order. The server-owned transition is:

```text
CHECKOUT_READY -> READY_FOR_PAYMENT
```

`POST /store/carts/:id/prepare` reloads and validates the cart, refreshes
authoritative prices/taxes, validates the Brazil address, revalidates the
selected shipping option and BRL totals, reconciles inventory reservations,
and returns a sanitized summary plus a signed, expiring readiness marker.

`cart.complete()` remains outside Gate 7. Completion is additionally closed
until `GATE8_FINALIZATION_ENABLED=true`, and payment processing flags remain a
separate guard.

## Server Authority

- Browser input is limited to checkout identifiers and address/contact data.
- Product prices, quantities, commercial metadata, inventory, reservations,
  shipping amounts, geography, discounts, taxes, totals, currency, and state
  are derived or revalidated server-side.
- Readiness markers are HMAC-bound to the cart id, expiry, and a snapshot that
  includes commercial metadata, prices, address, shipping, totals, and
  inventory identity.
- Completion rechecks the marker, current commercial lines, cart completion
  state, and persisted line reservations. Cart mutations invalidate the
  marker before mutation.

## Idempotency and Errors

Repeated preparation with an unchanged snapshot reuses valid reservations and
does not recreate them. Snapshot, price, inventory, shipping, ownership, and
tamper failures return controlled validation errors; no provider secrets or
raw provider payloads are returned.

## Frontend

The checkout flow is identification -> address -> delivery -> summary. The
summary renders only server-confirmed BRL values and shows
"Checkout preparado para pagamento". The payment control is disabled behind
the Gate 8 guard; no success, paid, or completed-order state is shown.

## Evidence

- Backend typecheck: PASS
- Backend unit: 19 suites / 133 tests PASS
- Backend HTTP integration: targeted legacy boundary and inventory fixtures PASS
- Backend lint: 0 errors (existing warnings only)
- Backend build: PASS
- Storefront typecheck: PASS
- Storefront unit: 62 tests PASS
- Storefront lint: 0 errors (existing warnings only)
- Storefront client and SSR build: PASS
- Secret scan: PASS (historical expired-secret warning only)
- `git diff --check`: PASS
- Final independent QA: `GATE_7_PASS`, P0=0, P1=0, P2=0

Browser E2E/responsive evidence was attempted but remains environment-blocked
by the local Vite `/br` 404 and backend publishable-key fixture. Full browser
coverage belongs to Gate 10; this limitation does not change the server-side
Gate 7 result.

## Explicitly Not Implemented

Pix, Mercado Pago, payment intents/sessions, webhooks, paid order state,
refunds, fiscal documents, and Gate 8 finalization remain disabled.
