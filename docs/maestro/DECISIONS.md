# FriggaFrio Decision Log

## DEC-001 - Payment Processing Is Fail-Closed

- Status: active.
- Decision: payment requests must return a controlled unavailable response until the provider is configured and homologated.
- Evidence: `apps/backend/src/utils/payment-availability.ts` and payment containment middleware.
- Consequence: `PAYMENTS_ENABLED=false` and `PAYMENT_PROVIDER_ENABLED=false` keep real sales disabled.
- Revisit when: a gateway is selected, credentials are rotated into the target environment and sandbox tests pass.

## DEC-002 - Session Authentication Is the Client Strategy

- Status: active.
- Decision: use Medusa session authentication and HTTP-only cookies; do not add a parallel JWT client flow.
- Consequence: CORS, SameSite, Secure cookies and Redis session persistence are release requirements.

## DEC-003 - B2B and B2C Data Must Remain Isolated

- Status: active.
- Decision: customer and company routes must enforce ownership and return non-enumerable errors for foreign resources.
- Consequence: changes to employee, company, quote and order authorization require focused tests.

## DEC-004 - Provider Selection Is Open

- Status: open decision.
- Current state: Stripe wiring exists; Mercado Pago is documented and fail-closed, but no Mercado Pago provider is registered by default.
- Rule: do not enable either provider until the team explicitly selects one and completes sandbox reconciliation tests.

## DEC-005 - Real Catalog Data Is Required for Commercial Release

- Status: active.
- Decision: demo or incomplete products must remain quote-only or hidden; direct purchase requires approved price, inventory and shipping metadata.
- Consequence: database catalog validation is a release gate, not a frontend-only task.

## DEC-006 - CI Gates Stay Fail-Closed

- Status: active.
- Decision: do not bypass lint, typecheck, tests, secret scanning or E2E failures with `continue-on-error`, `|| true` or disabled rules.
