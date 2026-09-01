# Checkout CEP and Shipping

The checkout and product-page estimate use the shared CEP lookup helper. It
normalizes to eight digits, debounces requests, cancels the previous request,
enforces a timeout, caches successful lookups temporarily, ignores stale
responses, fills street/bairro/city/UF, and focuses the separate number field.
Manual editing remains available after lookup failure or an unknown CEP.

The checkout keeps address details in the active SPA session; it does not place
the full address in localStorage. Authenticated customers use the backend
address resource when available.

Valid delivery state is server-owned. A new address or cart mutation clears the
old selection and requires a fresh quote. Pickup is the only mode that does not
require a delivery address. It sends no `shipping_address` to Medusa;
`pickup_location` identifies Loja 1 and the customer billing address remains
independent.

Checkout customer documents are normalized in the browser and validated again
at the server-owned preparation boundary. CPF/CNPJ check digits, Brazilian
phone length, Unicode names, and CEP shape are validated without logging the
complete personal values.

Regression coverage includes CEP helper tests, shipping policy boundary tests,
provider tests, stale-selection validation, and Checkout E2E console diagnostics.
