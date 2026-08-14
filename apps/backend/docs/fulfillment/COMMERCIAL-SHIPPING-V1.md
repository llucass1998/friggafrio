# Commercial Shipping V1

Status: `OFFICIAL_V1`.

The operational origin is `FriggaFrio - Loja 1 / Matriz`, Alameda Glete, 663,
Campos Eliseos, Sao Paulo/SP, 01215-001. Bootstrap configures the real Medusa
stock location, fulfillment set, Brazil service zone, shipping profile, sales
channel, and enabled `manual_manual` provider idempotently.

## Express delivery

Express is calculated only server-side after a trustworthy route-distance
provider resolves the persisted delivery address. The browser never supplies a
distance, zone, or price. Unknown distance and every destination over 100 km
receive no express option.

| Distance | Amount |
| --- | ---: |
| `(0, 10] km` | R$80 |
| `(10, 20] km` | R$100 |
| `(20, 30] km` | R$120 |
| `(30, 40] km` | R$140 |
| `(40, 50] km` | R$160 |
| `(50, 60] km` | R$180 |
| `(60, 80] km` | R$200 |
| `(80, 100] km` | R$250 |

The customer-facing estimate is: "Entrega expressa em até 6 horas em dia útil."
It is an estimate, not an operational guarantee.

## Free Grande SP standard delivery

`FRIGGAFRIO_STANDARD_FREE_GRANDE_SP` is the sole explicit R$0 option. It is
offered only when the server derives a configured Grande Sao Paulo destination
and eligible sellable merchandise is at least R$400. Quote-only, price-pending,
invalid, or missing-price lines never count toward the threshold. Its estimate
is: "Entrega padrão grátis — até 3 dias úteis."

The Grande SP city source is the server-side official 39-municipality RMSP set
(Lei Complementar Estadual 1.139/2011). An optional
`FRIGGAFRIO_SHIPPING_GRANDE_SP_CITIES` override is filtered against that set;
postal-code ranges and buyer-provided municipality flags are never trusted.

## Live Gate 6 evidence

`createShippingDistanceProviderFromEnv` loads the approved Google Routes
endpoint and credential from the backend environment. The adapter requires
both `FRIGGAFRIO_ROUTE_PROVIDER_URL` and
`FRIGGAFRIO_ROUTE_PROVIDER_API_KEY`; missing values fail closed with
`EXTERNAL_CREDENTIAL_REQUIRED`. With the canonical runtime configured, live
`routes.distanceMeters` responses were converted server-side to kilometres.

Live samples: Sao Paulo `5,318 m` (0-10 km), Osasco `19,222 m` (10-20 km),
Santo Andre `26,077 m` (20-30 km), Mogi das Cruzes `62,666 m` (60-80 km),
Santos `82,260 m` (80-100 km), and Ribeirao Preto `310,776 m` (>100 km,
express unavailable). The full boundary table remains covered by the backend
policy suite. Grande SP free shipping is enabled at R$400 and rejected at
R$399.99; invalid addresses and provider failures remain fail-closed.

No browser-supplied distance, municipality classification, or price is used.
V1.1 may review delivery economics, extend the radius, and improve route
resolution without changing the cart or shipping contract.
