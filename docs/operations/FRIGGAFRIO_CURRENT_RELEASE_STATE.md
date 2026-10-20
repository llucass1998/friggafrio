# FriggaFrio Current Release State

- Production SHA: `8f40e9c6c4b8a0430bad9b8a4b6f35322acdef27`.
- Release status: published through standard deployment pipeline with marketplace hiding, institutional navigation refinement, 4-column footer, and partner brand carousel.
- WSL source mirror: synchronized to the deployed SHA.
- Production database: backup validated before the release; no migration, seed, or restore was performed.
- Omie ERP Catalog & Real-Time Synchronization:
  - Real-time webhook receiver deployed and active at `/webhooks/omie` (proxied by Storefront to backend port 9000 without mutating Caddy).
  - Webhook topics supported: `Produto.MovimentacaoEstoque`, `Produto.Alterado`, `Produto.Inserido`, `Produto.Excluido`.
  - Full Omie catalog parameter `filtrar_apenas_omiepdv: "N"` enabled, uncovering 7,073 items (6,809 active).
  - 5,739 previously omitted products imported into Medusa; 70 drifted items updated with fresh fingerprints. Total active catalog: 6,818 products.
  - Physical inventory reconciled for Matriz Loja 1 across all 6,818 products (1,647 with positive physical stock).
  - Commercial state reconciled: 1,647 SELLABLE, 5,121 OUT_OF_STOCK, 50 PRICE_PENDING.
- Preserved failed candidate: `/home/srv/friggafrio/Maestro-deploy-failed-20260824T135300Z` remains available for forensics.
- Public status at record time: `/health` 200, `/br` 200, `/app` and `/app/` 200, Admin assets 200, and `/webhooks/omie` 200.
- Next deploy gate: use the immutable workflow with a new official candidate and retain public route validation.
