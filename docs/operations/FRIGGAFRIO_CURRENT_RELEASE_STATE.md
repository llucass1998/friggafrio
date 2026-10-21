# FriggaFrio Current Release State

- Production SHA: `359a2d31a140fb5eab2dd0ddd7b8046b74311dad`.
- Release status: published through standard deployment pipeline with updated phone numbers for Loja 1 and Loja 2 ((11) 3224-1670), matching CEP for Loja 2, confirmed address/CEP for Loja 3 (Avenida São Carlos, 847, Mogi Guaçu), and dedicated phone for Loja 3 ((19) 9982-8481).
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
