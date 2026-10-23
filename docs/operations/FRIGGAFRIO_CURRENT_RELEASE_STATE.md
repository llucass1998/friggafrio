# FriggaFrio Current Release State

- Production SHA: `86d0e8ee2b7ffef280aeaa6e9ff219d7d4e0c48b`.
- Release status: published through immutable replacement and synchronized to Hades production VPS (`hades.istigestao.com.br`). Official Instagram feed integrated on Home (`https://friggafrio.com.br/br`), with backend sync module (`instagram-feed`), scheduled sync routine, admin route (`/app/instagram`), and responsive editorial layout.
- WSL source mirror: synchronized to the deployed SHA (`86d0e8e`).
- Production database: migration `Migration20261023000000` applied safely (`instagram_post` and `instagram_sync_state` created); pre-deployment snapshots preserved.
- Omie ERP Catalog & Real-Time Synchronization:
  - Real-time webhook receiver deployed and active at `/webhooks/omie` (proxied by Storefront to backend port 9000 without mutating Caddy).
  - Webhook topics supported: `Produto.MovimentacaoEstoque`, `Produto.Alterado`, `Produto.Inserido`, `Produto.Excluido`.
  - Full Omie catalog parameter `filtrar_apenas_omiepdv: "N"` enabled, uncovering 7,073 items (6,809 active).
  - 5,739 previously omitted products imported into Medusa; 70 drifted items updated with fresh fingerprints. Total active catalog: 6,818 products.
  - Physical inventory reconciled for Matriz Loja 1 across all 6,818 products (1,647 with positive physical stock).
  - Commercial state reconciled: 1,647 SELLABLE, 5,121 OUT_OF_STOCK, 50 PRICE_PENDING.
- Preserved failed candidate: `/home/srv/friggafrio/Maestro-deploy-failed-20260824T135300Z` remains available for forensics.
- Public status at record time: `/health` 200, `/br` 200, `/app` and `/app/` 200, `/store/instagram-feed` 200, and Instagram feed section 100% visible on both `https://friggafrio.com.br/br` and `https://friggafrio.istigestao.com.br/br`.
- Next deploy gate: use the immutable workflow with a new official candidate and retain public route validation.
