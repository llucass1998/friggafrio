# Payment Readiness Audit

## 1. Frontend Registration of Fake Payments
- **Finding:** In `apps/storefront/src/components/payment-button.tsx`, manual and stripe payment providers are currently supported. The `ManualPaymentButton` initiates order completion without interacting with any real gateway.
- **Finding:** The backend `MercadoPagoProvider` in `apps/backend/src/modules/mercado-pago/service.ts` is mostly a stub. `initiatePayment` returns a random MP session string but does not talk to Mercado Pago API. `authorizePayment` forcefully returns `status: "authorized"` which effectively enables fake/stub payments without any API check.
- **Action Needed:** The frontend relies on whatever the provider's `authorizePayment` yields. The backend MP provider needs to implement real Mercado Pago SDK logic.

## 2. Checkout Finalization Idempotency / Double Click
- **Finding:** In `apps/storefront/src/components/payment-button.tsx`, `StripePaymentButton` sets `submitting` state and disables the button. `ManualPaymentButton` does the same. However, there's no visible idempotency key usage (which Medusa typically handles under the hood for API calls, but good to check).
- **Finding:** The buttons do protect against double clicks using the `submitting` state.

## 3. Webhooks & Orders
- **Finding:** A webhook route exists in `apps/backend/src/api/webhooks/mercado-pago/route.ts`. It performs signature validation and dispatches `processMercadoPagoWebhookWorkflow`.
- **Action Needed:** Need to verify `processMercadoPagoWebhookWorkflow` logic and if `MercadoPagoProvider` translates webhook events into standard Medusa webhook actions correctly (right now `getWebhookActionAndData` returns `not_supported`).

