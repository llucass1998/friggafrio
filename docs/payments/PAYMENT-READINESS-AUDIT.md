# Payment Readiness Audit

## 1. Frontend Registration of Fake Payments
- **Finding:** In `apps/storefront/src/components/payment-button.tsx`, manual and stripe payment providers are currently supported. The `ManualPaymentButton` initiates order completion without interacting with any real gateway.
- **Finding:** The backend `MercadoPagoProvider` in `apps/backend/src/modules/mercado-pago/service.ts` is mostly a stub. `initiatePayment` returns a random MP session string but does not talk to Mercado Pago API. `authorizePayment` forcefully returns `status: "authorized"` which effectively enables fake/stub payments without any API check.
- **Action Needed:** The frontend relies on whatever the provider's `authorizePayment` yields. The backend MP provider needs to implement real Mercado Pago SDK logic so it doesn't just authorize arbitrary inputs. The Frontend currently just hits backend's `completeCartOrder` when Manual Payment is clicked. Wait for keys instead of auto-completing.

## 2. Checkout Finalization Idempotency / Double Click
- **Finding:** In `apps/storefront/src/components/payment-button.tsx`, `StripePaymentButton` sets `submitting` state and disables the button. `ManualPaymentButton` does the same. 
- **Action Done:** I've added a check `if (submitting) return` to the `handlePayment` handlers to ensure no race conditions happen during the double click before state update takes effect.
- **Action Done:** In `apps/storefront/src/pages/order-payment.tsx`, added `|| isPaid` check to prevent completing an already paid order (idempotency).

## 3. Webhooks & Orders
- **Finding:** A webhook route exists in `apps/backend/src/api/webhooks/mercado-pago/route.ts`. It performs signature validation and dispatches `processMercadoPagoWebhookWorkflow`.
- **Finding:** `processMercadoPagoWebhookWorkflow` idempotently creates/updates a webhook event in the database (`payment-webhook-event` module). 
- **Finding:** It delegates the validation to `paymentProvider.getPaymentStatus`, which is currently a stub for `mercado-pago` (returning pending by default unless overwritten). When fixed, it correctly reconciles the status on the event.
- **Action Needed:** Need to hook this up into actual Order capture/update within Medusa via workflows instead of just marking the webhook as processed. Orders should appear in "Minha Conta" once created, but payment status from Webhook won't reflect in Order yet.
