# Price and Region Audit

## Currency Formatting
All places where currency is formatted have been updated to default to \`pt-BR\` locale and \`BRL\` currency. We introduced a centralized utility to standardize this across the codebase.

### Created
- \`apps/storefront/src/lib/utils/currency.ts\`: Contains \`formatCurrencyAmount\` utility for unified price formatting (defaults to pt-BR/BRL).

### Updated Components & Utils
- \`apps/storefront/src/components/ui/price.tsx\`: Now imports and uses \`formatCurrencyAmount\`.
- \`apps/storefront/src/lib/utils/price.ts\`: \`formatPrice\` now defaults \`currency_code\` to \`BRL\` and \`locale\` to \`pt-BR\`.
- \`apps/storefront/src/pages/employees.tsx\`: Removed hardcoded USD formatting in \`formatCurrency\`, replaced with \`formatCurrencyAmount\`.
- \`apps/storefront/src/pages/orders.tsx\`: Standardized \`formatCurrency\` using the new utility. Updated \`formatDate\` to use \`pt-BR\`.
- \`apps/storefront/src/pages/quotes.tsx\`: Standardized \`formatCurrency\` using the new utility. Updated \`formatDate\` to use \`pt-BR\`.

## Region Audit
We searched the codebase for any remaining hardcoded regions or currencies like DKK or USD that were missing the fallback to \`BRL\`.
Most places safely rely on the Medusa Cart or Region context (which returns dynamic currencies), and default fallback logic now strictly defaults to \`BRL\`.

The \`BRL\` and \`pt-BR\` implementations have been thoroughly adopted in UI representations (quotes, orders, employees, price display components).
