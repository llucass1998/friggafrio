# FriggaFrio Contracts

## Environment Contract

- Backend requires `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` and `COOKIE_SECRET`.
- Production/staging requires Redis for session persistence.
- Payment processing requires both `PAYMENTS_ENABLED=true` and `PAYMENT_PROVIDER_ENABLED=true`, plus valid provider credentials.
- Storefront uses `VITE_MEDUSA_BACKEND_URL` and `VITE_MEDUSA_PUBLISHABLE_KEY`.
- Production CORS values must be explicit HTTPS origins; never use wildcard origins.

## Payment Contract

- `getPaymentAvailability()` is the single backend gate for processing.
- Disabled payment responses use HTTP 503 and code `payments_temporarily_unavailable`.
- No client action may report payment success before the backend confirms the provider state.
- Webhook handling must validate signature, enforce idempotency and reconcile with the gateway before changing order/payment state.

## Authentication Contract

- Client authentication uses a Medusa session cookie.
- Private routes require the authenticated customer/company context.
- Customer, employee, company, quote and order resources must be ownership-checked.
- Google login remains unavailable until a registered provider, callback/state validation and integration tests exist.

## Commerce Contract

- Direct purchase requires an approved price, a valid variant and approved inventory/shipping metadata.
- Incomplete or quote-only products must route to quote/WhatsApp instead of silently completing checkout.
- Region and currency come from the Medusa cart/region; Brazil/BRL is the default commercial target.

## Quality Contract

- Required local gates: backend build/typecheck/lint/unit; storefront lint/typecheck/unit/build.
- Required integration gates: migrations, HTTP integration, real-stack Playwright E2E and staging smoke tests.
- CI remains fail-closed and must not suppress errors.
