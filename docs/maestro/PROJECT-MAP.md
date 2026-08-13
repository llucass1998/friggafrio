# FriggaFrio Project Map

Baseline: 2026-08-10

## Architecture

- `apps/backend`: Medusa v2 backend, custom modules, workflows, Store API, Admin API, webhooks and email templates.
- `apps/storefront`: React 19, TanStack Router, Vite, TanStack Query, Stripe UI components and public storefront.
- `deploy`: local and production Docker Compose, Nginx and TLS helpers.
- `.github/workflows`: CI, backend CD, CodeQL and update workflows.
- `docs`: audit reports, release checklists, commerce rules and operational documentation.

## Main Runtime Flow

1. Storefront calls the Medusa Store API through `apps/storefront/src/lib` and `apps/storefront/src/lib/data`.
2. Backend resolves Medusa core modules plus custom modules under `apps/backend/src/modules`.
3. PostgreSQL stores commerce and custom module data; Redis is required for secure production sessions.
4. Cart, checkout, quote, order and payment state are controlled by backend workflows and middleware.
5. Payment processing is fail-closed until both payment flags and a configured provider are enabled.

## Main Backend Modules

- `company`: companies, employees and addresses.
- `quote`: quote lifecycle and quote-to-order links.
- `customer-profile`: Brazilian customer profile data.
- `product-sales-policy`: direct purchase versus quote-only rules.
- `payment-attempt`: payment attempt audit data.
- `payment-webhook-event`: webhook idempotency/audit data.
- `audit-log`: immutable audit events.

## Main Storefront Areas

- Public pages: home, store, category, product, brands, stores and support pages.
- Account pages: login, register, orders, quotes and settings.
- Commerce flow: cart, checkout, shipping, payment and order confirmation.
- Shared state: auth and cart contexts plus TanStack Query hooks.

## Release Gates

- Backend build, typecheck, lint and unit tests.
- Storefront lint, typecheck, unit tests and client/SSR build.
- PostgreSQL migrations and HTTP integration tests.
- Playwright E2E with real backend, database and deterministic fixtures.
- Secret scan, artifact guard, staging smoke test and rollback evidence.

## Current Blockers

- Frontend typecheck: 6 errors.
- Frontend lint: 570 errors and 93 warnings.
- Backend typecheck: 24 errors.
- Backend unit tests: 9 suites fail during Jest parsing/configuration.
- Payment processing disabled; Mercado Pago route is fail-closed with HTTP 503.
- Database integration and real catalog/inventory require staging validation.
- Historical JWT requires revocation/rotation.
- E2E suite has 46 tests but is not green against the real stack.

## Search Strategy

1. Consult this file first.
2. Use `rg` to locate the symbol or route.
3. Open only the directly related file.
4. Follow imports or contracts only when required.
5. Expand to module-wide analysis only for a MEDIUM/HIGH task.
