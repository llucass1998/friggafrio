# FriggaFrio Local State — 2026-08-25

## Approved locally

- Backend and Storefront typecheck.
- Backend unit tests: 44 suites / 232 tests.
- Shipping policy and calculated provider tests: 25 tests plus provider pass.
- Checkout E2E: 1 Chromium test, console warning/error diagnostics zero.
- Local shipping estimates: central free, interior R$150/R$250, coast R$150/R$250.
- WSL and public environments remain untouched.

## Not approved

- Mercado Pago Pix/card sandbox has not run because the Local machine does not
  contain sandbox credentials.
- Mercado Pago webhook reconciliation to Payment Session/Order remains a gate
  before any payment provider enablement.
- WSL deploy, commit, and push are intentionally not performed in this state.

## Additional local gate evidence

- Checkout E2E passed on Chromium and Mobile Chrome after the live payment
  adapter and the preparation-step navigation correction.
- Store pickup state tests pass for initial preparation, operator readiness,
  collection, duplicate-transition rejection, and advisory-lock serialization.
- Backend and Storefront lint complete with pre-existing warnings only; no lint
  errors remain in the changed checkout source.
- Backend and Storefront builds and typechecks pass after the pickup changes.

## Required resume gate

Set machine-local `MERCADO_PAGO_ENV=sandbox`,
`MERCADO_PAGO_ACCESS_TOKEN`, and `MERCADO_PAGO_WEBHOOK_SECRET` through the
secret manager or ignored `.env`, then run the payment sandbox and final security
regression. Never commit or print these values.
