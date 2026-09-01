# Omie/NF-e Homologation Checklist

This checklist contains only the external fiscal configuration required before
the local fail-closed gateway can be enabled. No credentials or personal data
belong in this document.

- Confirm the Omie company identity and that the fiscal environment is **homologation**, not production.
- Confirm the certificate is installed, valid, and its expiration date is recorded by the administrator.
- Confirm the company tax regime, municipal registration, address, city, and IBGE municipality code.
- Confirm the NF-e series, numbering policy, and the next available homologation number.
- Approve the fiscal scenario and operation nature for sales and for FriggaFrio Loja 1 pickup.
- Complete each sellable product with Omie code, SKU, unit, NCM, CFOP, CST/CSOSN, origin, CEST when applicable, and tax parameters.
- Confirm customer fiscal requirements: CPF/CNPJ, legal name, address, city/IBGE, UF, CEP, and state registration when applicable.
- Confirm the official Omie contracts for customer lookup/create, Pedido de Venda, item mapping, payment terms, freight/pickup, and idempotency reference.
- Confirm the official validation, faturamento, processing-status, rejection, and retry contracts.
- Confirm the official NF-e status, access-key, number, series, authorization-date, XML, and DANFE retrieval contracts.
- Confirm the fiscal rules for cancellation, refund reconciliation, and out-of-order events; no automatic cancellation is enabled by this application.

Until every item is approved, keep writes disabled and classify the order as
`BLOCKED_MISSING_CONFIGURATION`.
