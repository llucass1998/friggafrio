# FriggaFrio Shipping Policy V1

`SHIPPING_POLICY_VERSION=1`

The backend is the only authority for region, distance, eligibility, price,
currency, delivery copy, and estimated date. The storefront renders the quote
returned by `POST /store/shipping/estimate` and never calculates a price.

## Central configuration

All prices and limits are in
`apps/backend/src/utils/commercial-shipping-policy.ts` and are represented in
integer centavos where money is calculated. Coverage city sets can be replaced
through backend environment configuration without changing the algorithm.

## Approved modes

- Pickup: Loja 1, Alameda Glete 663, Campos Elíseos, São Paulo/SP, 01215-001;
  always `0` centavos and independent of CEP.
- Motoboy: server route distance from Loja 1; 0–10 km R$80, then R$100,
  R$120, R$140, R$160, R$180, R$200, R$250 through 100 km; over 100 km is
  This historical over-100 km formula is not active: Motoboy is unavailable
  above the approved 100 km operating limit.
- Carro FriggaFrio: central/near is free; interior and coast use R$150 below
  R$1,000 subtotal and R$250 at or above R$1,000. Interior routes are Wednesday;
  coast routes are Thursday.

Subtotal is the complete server cart subtotal after discounts and before freight.
Frontend-submitted distance, subtotal, price, or date is never trusted.

## Pickup operation

The sole pickup fulfillment is created with persisted provider data
`awaiting_preparation`. An authenticated Admin operator can advance it only to
`ready_for_pickup`, then `collected`; the transition records the operator and
timestamp and uses an order-scoped PostgreSQL advisory lock to reject duplicate
or reversed collection. The customer sees no readiness instruction before the
operator has marked it ready. Inventory remains governed by Medusa's existing
reservation and fulfillment workflows; this policy does not create a second
store or a frontend stock mutation.

## Invalidation

Changing CEP, address, cart lines, quantity, discounts, or policy invalidates
the previous quote and removes the selected shipping method. Checkout preparation
revalidates the persisted option and server total before payment.

## Presentation and availability

Checkout always renders these three cards in this order: Loja 1 pickup, normal
Carro FriggaFrio, and express Motoboy. Pickup is always selectable. The other
two cards are selectable only when the server returns both commercial
eligibility and a persisted Medusa shipping option ID. A non-eligible, missing
configuration, timeout, or provider failure leaves the applicable card visible
and disabled with a sanitized reason; the storefront never invents a price or
hides the modality.

## Current limitation

Grande São Paulo is classified from the official municipality set. No new
commercial price is invented for that class; until a rule is approved it exposes
pickup and any distance-resolved motoboy option only.
