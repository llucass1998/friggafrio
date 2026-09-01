# FriggaFrio Omie/NF-e Read-only Audit

Date: 2026-08-29
Scope: local source inspection only. No Omie API request, fiscal write, migration, invoice, or deploy was performed.

## Runtime and credentials

- `OMIE_API_URL`, `OMIE_APP_KEY`, `OMIE_APP_SECRET`, and `OMIE_NFE_ENVIRONMENT` are absent from the current process environment (presence checked as booleans only).
- The existing client fails closed when any Omie credential is missing.
- The client permits only the read-only operations `ListarProdutos` and `ListarPosEstoque`; write operations raise `READ_ONLY_VIOLATION` before network access.

## Existing integration map

```text
Omie ListarProdutos / ListarPosEstoque
  -> apps/backend/src/integrations/omie/reader.ts and stock-reader.ts
  -> mapper.ts (normalized product, variant, price, inventory, fiscalCode)
  -> reconciliation.ts (stable external id/SKU, fingerprint, conflict/no-op/create plan)
  -> existing Medusa projection and Storefront commercial eligibility
```

Stable identity is designed around the Omie external product identifier and variant SKU. Stock uses the operational `fisico` value and preserves missing, zero, and invalid states without inventing inventory.

## Fiscal and order mapping status

The source contains normalized `fiscalCode` support and explicit approval gates, but no implemented fiscal authority for NCM, CEST, CFOP, CST/CSOSN, PIS, COFINS, IPI, ICMS, IBS/CBS, tax scenario, series, certificate, or homologation environment. There is no source-backed Pedido de Venda Omie or NF-e outbox/workflow in this audit scope.

Required future mapping (design only):

```text
Medusa Order
  -> payment confirmed and reconciled
  -> idempotent Omie customer lookup/create
  -> idempotent Pedido de Venda (Order id as integration code)
  -> fiscal validation
  -> homologation invoice request and polling
  -> private XML/DANFE retrieval
  -> cancellation/refund reconciliation
```

## Gaps and implementation plan

1. Obtain administrative/contábil confirmation of Omie company, certificate, series, fiscal scenario, and homologation availability; do not infer values from catalog data.
2. Extend the fiscal catalog contract with explicit required fields and `FISCAL_DATA_MISSING`, `MAPPING_CONFLICT`, `ACCOUNTANT_REVIEW_REQUIRED`, and related fail-closed statuses.
3. Add an audited Medusa fiscal module and migrations only after Gate B and shipping pass; enforce one fiscal record per Order, unique integration code, NF-e key, and external event.
4. Implement an outbox triggered only by `PAYMENT_CONFIRMED_AND_RECONCILED`, with advisory lock, retry/backoff, timeout, dead-letter/manual review, and sanitized logs.
5. Add Omie customer/order idempotency and official validation/faturamento polling in homologation only.
6. Add private, authorization-checked XML/DANFE storage and customer/admin access paths.
7. Test rejection, cancellation, refund, timeout, replay, out-of-order events, and reconciliation before any production activation.

## Current classification

`OMIE_NFE_AUDIT_STATUS=READ_ONLY_COMPLETE_WITH_EXTERNAL_FISCAL_CONFIGURATION_REQUIRED`

`OMIE_NFE_IMPLEMENTATION=NOT_STARTED_BY_POLICY`

## Local implementation follow-up

The local implementation wave introduced a fail-closed fiscal projection and
outbox under the existing Omie integration. It does not issue invoices, create
sales orders, call the Omie API, or change Omie data. A reconciled authorized
or captured payment can create one idempotent local fiscal intent only after
all fiscal mappings validate. Pending, failed, cancelled, and refunded
payments cannot make an order eligible.

The following external configurations remain mandatory before controlled
homologation and are intentionally not inferred by the application: Omie
company identity, homologation availability, certificate, series/numbering,
fiscal scenario, product NCM/CFOP/CST or CSOSN/origin/CEST where applicable,
customer fiscal identity and IBGE municipality, tax treatment, and the
approved Omie XML/DANFE retrieval contract.
