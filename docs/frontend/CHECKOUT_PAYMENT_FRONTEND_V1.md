# Checkout Payment Frontend V1

The Local checkout has four guarded stages: address, delivery, payment and
review. Address and delivery changes clear preparation and payment selection;
the reducer prevents skip-ahead and double-submit state transitions.

Totals come from `READY_FOR_PAYMENT` preparation. The review renders the
server subtotal, shipping and total and requires explicit consent. Pix and
card are represented by the adapter contract. The production/default adapter
throws a controlled unavailable error, while the demo adapter is restricted to
an explicit development flag.

The card view contains only the secure SDK mount point and holder/installment
metadata. PAN, CVV, access tokens and webhook secrets are never owned by the
React application.
