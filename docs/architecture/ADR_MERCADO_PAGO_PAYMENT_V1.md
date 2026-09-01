# ADR: Mercado Pago Payment V1

- Status: frontend contract transported; backend provider remains disabled until sandbox homologation.
- Scope: Local checkout only. No WSL or production activation is implied.

## Decision

The Storefront uses a typed adapter and reducer boundary for Pix and card. The
default adapter fails closed. A visible mock is available only when
`VITE_CHECKOUT_PAYMENT_MOCK=true` in development/test. The UI reserves
`#mercado-pago-secure-card-mount`; FriggaFrio does not own PAN or CVV inputs.

The backend remains the authority for BRL totals, shipping, payment status,
idempotency, webhook verification, cancellation, and refund. Public keys may
reach the browser; access tokens and webhook secrets may not.

## Required backend gate

Before enabling the adapter in sandbox, implement the Medusa Payment Provider,
Orders API integration, signed webhook endpoint, durable deduplication,
reconciliation, Pix expiry, card tokenization/3DS, cancellation, refund and
security regression tests. Production remains fail-closed until explicit
homologation.
