# Omie Stock Reconciliation

Date: 2026-08-14

## Decision

The previous all-zero result was not a proof of operational zero stock. The
catalog discovery path used `ListarProdutos.quantidade_estoque` and persisted
that value as `metadata.inventory_quantity_observed`. The operational Omie
stock source is the read-only `ListarPosEstoque` operation instead.

## Source Contract

| Field | Value |
| --- | --- |
| Endpoint | `https://app.omie.com.br/api/v1/estoque/consulta/` |
| Operation | `ListarPosEstoque` |
| Physical stock field | `fisico` |
| Reserved field | `reservado` |
| Balance field | `nSaldo` |
| Product identity | `nCodProd` (Medusa `metadata.omie_external_id`) |
| SKU identity | `cCodigo` (Medusa variant `sku`) |
| Location | `codigo_local_estoque=1982255302` |
| Position date | `14/08/2026` |

The reconciliation reads this operational location explicitly. It can be
overridden only with the non-secret `OMIE_INVENTORY_LOCATION_CODE` runtime
setting; the homologated default remains `1982255302`.

The mapper now distinguishes `REAL_POSITIVE`, `REAL_ZERO`, `MISSING`, and
`INVALID`. Negative physical quantities are invalid and fail closed; they are
never converted to zero.

## Read-Only Evidence

The complete paginated read returned 140 pages and 6,999 rows:

| Source state | Rows |
| --- | ---: |
| `REAL_POSITIVE` | 1,738 |
| `REAL_ZERO` | 5,191 |
| `MISSING` | 0 |
| `INVALID` (negative physical value) | 70 |

No Omie write was executed.

The prior `ListarProdutos` audit reported 1,229 records with zero in the
catalog field. That result is therefore classified as `MIXED`: it is a real
zero in that catalog field, but it is not the operational stock source.

## Medusa Cross-Check

- 1,080 active Omie products exist in Medusa.
- 1,080 inventory items and 1,080 inventory levels are mapped to the
  homologated location.
- Before reconciliation, all 1,080 levels were stocked at zero.
- 332 positive Omie product identities matched active Medusa products; all 332
  were incorrectly zero in Medusa.
- 729 matched products were already zero and 19 matched products had invalid
  negative Omie stock and were left fail-closed.
- No duplicate inventory levels or identity collisions were found.

## Correction

`reconcile-omie-inventory.ts` is the authoritative projection entrypoint. It
reads live `ListarPosEstoque`, matches by `nCodProd` and only falls back to
SKU when the external identifier is absent, and updates only
`inventory_level.stocked_quantity`. It never accepts browser values, never
writes to Omie, and never overwrites `reserved_quantity`.

The historical `project-omie-inventory-levels.ts` entrypoint now delegates to
the live reconciliation path so stale catalog metadata cannot reapply zero
stock.

Apply evidence:

```text
create=0
update=332
no_op=729
skipped=19 (SOURCE_STOCK_INVALID)
reservations_preserved=yes
omie_writes=0
```

Post-apply database evidence:

```text
inventory levels: 1080
stocked > 0: 332
stocked = 0: 748
reserved > 0: 0
invalid stocked < reserved: 0
duplicate (inventory_item, location) groups: 0
```

Second dry run is idempotent:

```text
update=0
no_op=1061
skipped=19
```

The Store API returned HTTP 200 and exposed positive inventory for sampled
products after the projection. No payment, checkout, shipping, price, or
category behavior was changed.

## Remaining Data Quality

The 19 active Medusa identities whose Omie physical value is negative remain
unavailable by design. They are reported as `INVALID`, not `REAL_ZERO`, and
require an Omie data correction before becoming sellable. Positive Omie rows
without an active Medusa catalog identity are not imported by this scoped
reconciliation. If a source becomes `MISSING` or `INVALID` while Medusa still
has a positive level, the apply path blocks rather than leaving stale stock
available.
