# Mercado Pago Source Integrity - 2026-08-26

## Incident: `SOURCE_MUTATION_DURING_TEST`

- Symptom: payment work can be mistaken for a rollback when source changes while
  tests, watchers, cleanup, or interrupted commands are active.
- Root cause: the repository had no before/after source manifest for focused
  payment validation. A runtime restart or a dirty worktree could therefore be
  confused with a source rollback without evidence.
- Prevention: `scripts/source-integrity-guard.mjs` snapshots selected source
  files before a command and verifies their SHA-256 values afterwards. It emits
  `SOURCE_MUTATION_DURING_TEST` plus a temporary evidence file on a difference.
- Guard: destructive Git commands and source-copy/cleanup commands are rejected
  by the guarded command runner. It never performs restoration, deletion,
  reset, clean, stash, or source copy itself.
- Recovery: preserve the evidence, compare it with the external checkpoint and
  source history, then recover only missing hunks from an approved source.
- Rollback: remove only the guard files through an explicitly reviewed source
  change; never use a destructive Git command to silence an integrity failure.
- Resume gate: `DECLINED_CARD_SANDBOX_SANITIZED_ERROR_DIAGNOSIS`.

## Incident: Declined Card Returned Generic 500

- Symptom: a sandbox declined card returned `An unknown error occurred` from
  the Store API even though Mercado Pago had created a structured failed Order.
- Root cause: the Orders API returns HTTP 402 with the failed Order under
  `data`. The gateway client treated every non-2xx response as an exception,
  preventing Medusa from persisting the rejected session.
- Correction: accept only HTTP 402 responses containing a structurally valid
  declined Order (`failed`, `rejected`, or `cancelled`), then persist the
  provider Order and return Medusa payment-session status `error`.
- Prevention: client and provider regression tests cover the 402 response,
  Order persistence, `failed -> error`, and the absence of an HTTP 500.
- Security: diagnostics retain only HTTP status, sanitized category, and
  request ID. They never store PAN, CVV, card token, access token, or webhook
  secret.
- Resume gate: continue with card installments, then 3DS, real sandbox webhook,
  cancel, refund, and reconciliation validation.
## Recovery continuation

- `SOURCE_OR_RUNTIME_REGRESSION_CONFIRMED`: the local newsletter had reverted to the legacy dark layout while the public reference remained on the approved light-card layout.
- The approved newsletter was restored semantically in `apps/storefront/src/components/newsletter-signup.tsx`, including mandatory consent, privacy link, honeypot, live status and real Portuguese Unicode.
- Backend newsletter validation now requires `consent=true` and a versioned consent value; honeypot submissions are ignored without persistence.
- Duplicate local Routes environment definitions were removed so the backend has one URL and one key definition. The real ComputeRoutes call currently returns sanitized `403 PERMISSION_DENIED`; Motoboy remains visible but disabled until the Google project/key permission is corrected.

## Incident: `ACCESSIBILITY_SOURCE_OR_RUNTIME_REGRESSION`

- Symptom: Local had older accessibility button/panel source while the WSL
  release rendered the approved behavior.
- Evidence: Provider, context and stylesheet SHA-256 values matched WSL; only
  `AccessibilityFloatingButton.tsx` and `AccessibilityPanel.tsx` diverged.
- Root cause: outdated source hunks were present in the Local files, not a
  runtime, provider, HMR or stylesheet mismatch.
- Correction: restore only the WSL-approved accessibility hunks: focus-visible
  control, decorative icon semantics, mobile safe-area panel sizing, one
  Dialog description, focus return and typed boolean preference updates.
- Prevention: source tests assert these contracts; the 99-cycle accessibility
  regression runs with the source-integrity manifest before and after.
- Rollback: never restore source automatically. Preserve the manifest and use
  a reviewed semantic patch from an approved source reference.
