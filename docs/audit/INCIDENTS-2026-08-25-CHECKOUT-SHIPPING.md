# Checkout and Shipping Incidents — 2026-08-25

## Local upload provider

- Cause: local file provider/runtime configuration was incomplete, so upload
  returned 500 and the gallery produced an image without a URL.
- Correction: local provider configuration is asserted at startup and gallery
  state only accepts a validated non-empty URL.
- Prevention: provider unit tests plus upload response validation; rollback is
  the previous Local commit, and the gate is the upload regression suite.

## Dialog accessibility warning

- Cause: wrapper components supplied fallback description IDs that did not match
  Radix's generated description context.
- Correction: wrappers now render a context-bound `Dialog.Description` without
  overriding Radix's generated `aria-describedby`.
- Prevention: Checkout E2E captures console warnings/errors and requires zero.

## Shipping city encoding

- Cause: mojibake city literals prevented São Paulo from matching central
  coverage.
- Correction: canonical coverage keys are ASCII and normalized server-side.
- Prevention: central, interior, and coast quote tests cover normalized inputs.

## Three delivery modalities hidden by eligibility filter

- Cause: the estimate returned only eligible rates, while the native Medusa
  selection context enabled only the resolved motoboy rate. This made pickup or
  car appear in the UI without being accepted by the cart, and made unavailable
  cards disappear entirely.
- Correction: the estimate always returns pickup, car, and motoboy in that
  order. Eligibility is expressed with `available` plus a sanitized reason, and
  the Medusa context enables every server-eligible persisted rate.
- Prevention: backend policy/estimate tests cover CEP `05144-085`, persisted
  option IDs, provider absence, and the 100 km boundary; desktop and mobile
  checkout E2E assert the three-card order and selectable mocked rates.
- Rollback: revert only the shipping presentation wave; resume at backend
  shipping estimate tests and checkout E2E. Route provider authorization is an
  external gate and must never be replaced with a client-side monetary fallback.

## Local route provider authorization

- Symptom: the configured server-side Google Routes `ComputeRoutes` request
  returns HTTP 403, so Motoboy remains visible but unavailable for an otherwise
  valid Sao Paulo address.
- Required action: enable and authorize Google Routes API `ComputeRoutes` for
  the existing backend key/project, including its billing and key restrictions.
  Do not replace it with the frontend Maps key and do not log either key.
- Guard: absent, timeout, or failed routes stay fail-closed; the browser cannot
  choose Motoboy or synthesize a price until the backend returns a real route.

## Mercado Pago webhook

- Cause: the custom webhook route accepted signed events while payment
  homologation was disabled, and did not yet reconcile payment sessions.
- Correction: route is fail-closed unless both payment flags are enabled; event
  persistence remains idempotent.
- Remaining gate: sandbox credentials and reconciliation integration are still
  required before enabling provider processing.

## Medusa monetary unit at the Mercado Pago boundary

- Cause: Medusa v2 exposes monetary amounts in major BRL units while the first
  provider draft treated them as centavos, producing a 100x discrepancy.
- Correction: conversion helpers now make the major-unit/centavo boundary
  explicit for create, update, refund, and webhook projections.
- Failed attempt: the provider-only implementation was rejected by its unit
  test because `123.45` became `1.23`; no gateway call was enabled.
- Prevention: provider money tests assert the exact Mercado Pago decimal and
  the backend type/unit test gates are mandatory before release.
- Rollback: revert the isolated payment wave before enabling the provider; the
  next gate is the sandbox contract suite.

## Store pickup operational state

- Cause: pickup pricing and checkout metadata existed, but fulfillment creation
  returned an empty payload and had no persisted operational transition.
- Correction: pickup fulfillment now starts at `awaiting_preparation`; the
  authenticated Admin route records monotonic `ready_for_pickup` and `collected`
  transitions, operator IDs, timestamps, and a PostgreSQL advisory lock.
- Prevention: pickup state and route tests reject duplicate, reversed, or
  unauthenticated transitions; pickup remains restricted to Loja 1 and price 0.
- Rollback: revert the pickup state files without touching orders or inventory;
  resume at the pickup unit/integration gate.

## Checkout pickup address coherence

- Symptom: the storefront used the Loja 1 address as `shipping_address` when
  pickup was selected, which could also make the billing copy misleading.
- Correction: pickup now sends `shipping_address: null`, stores
  `pickup_location` separately, and requires an independent customer billing
  address. Delivery address validation remains conditional on the selected
  delivery mode.
- Prevention: preparation snapshots include the billing address, backend
  preparation rejects pickup without billing data, and focused tests cover
  pickup payloads and billing changes.

## Checkout input validation

- Correction: CPF/CNPJ check digits, repeated-document rejection, Unicode-safe
  names, Brazilian phone/CEP normalization, and structured backend document
  validation were added to the checkout boundary.
- Prevention: storefront and backend unit tests cover typing/paste-safe numeric
  normalization and invalid direct payloads. Sensitive documents are never
  logged.
