# FriggaFrio — Git Baseline

Fotografia: 2026-07-26 01:10:35 -03:00
Responsável técnico: IDE Agent

## Identidade do repositório

| Item | Resultado |
|---|---|
| Branch | `main` |
| Commit | `e576de2 fix(storefront): Complete refactor and finalization for production MVP` |
| Staged | 0 |
| Modificados rastreados | 4 |
| Adicionados rastreados | 0 |
| Excluídos rastreados | 0 |
| Não rastreados | 136 |

## Alterações rastreadas preexistentes

| Arquivo | Alteração observada |
|---|---|
| `apps/backend/integration-tests/http/health.spec.ts` | adiciona `POSTGRES_URL` de teste |
| `apps/backend/src/admin/utils/format-amount.ts` | locale `en-US` para `pt-BR` |
| `apps/backend/src/email-templates/order-confirmation.tsx` | locale `en-US` para `pt-BR` |
| `pnpm-lock.yaml` | registra `playwright` no importer do storefront |

Resumo do diff: 4 arquivos, 7 inserções e 3 remoções. Essas mudanças não foram criadas
por esta recuperação e serão preservadas.

## Arquivos ignorados relevantes

- `.turbo/`, `.vscode/`, `.netlify/`, `.vite/`
- `node_modules/` na raiz e nos workspaces
- `apps/backend/.medusa/`
- `apps/storefront/.tanstack/`, `apps/storefront/dist/`
- `backend.log`, `storefront.log`
- `apps/backend/.env`, `apps/storefront/.env`

O comando com `--ignored` encontrou avisos de caminho longo dentro de `node_modules`.
Isso não alterou a contagem dos 136 arquivos não rastreados.

## Classificação dos não rastreados

A ação é provisória até a Fase 5. “Versionar após validação” não significa executar
`git add`; nenhum arquivo foi adicionado ao índice.

| Categoria | Qtde. | Ação provisória | Segredo |
|---|---:|---|---|
| 1. Código/asset de produção | 67 | versionar após revisão funcional, licença e privacidade | revisar |
| 2. Teste | 7 | versionar se determinístico e relevante | revisar fixtures |
| 3. Migration | 2 | versionar somente após homologação de schema | não identificado |
| 4. Script necessário/candidato | 25 | revisar idempotência e efeitos antes de decidir | revisar |
| 5. Configuração | 2 | versionar após segurança e portabilidade | revisar |
| 6. Documentação útil/candidata | 14 | consolidar duplicações e versionar o útil | não identificado |
| 8. Relatório gerado | 3 | não versionar como fonte de verdade | revisar |
| 10. Arquivo temporário | 1 | ignorar/remover apenas após revisão | revisar |
| 11. Possível segredo | 2 | não versionar até sanitização | sim, potencial |
| 13. Cache/lock local | 1 | ignorar | não identificado |
| 14. Patch/script temporário | 12 | não versionar como produção; revisar antes de remover | revisar |
| **Total** | **136** |  |  |

### 1. Código e assets de produção — 67

Código backend (21):

- `apps/backend/src/api/admin/audit-logs/route.ts`
- `apps/backend/src/api/admin/orders/[id]/refund/route.ts`
- `apps/backend/src/api/auth/customer/google/route.ts`
- `apps/backend/src/api/middlewares/validate-demo-price.ts`
- `apps/backend/src/api/store/customers/middlewares.ts`
- `apps/backend/src/api/store/customers/register/route.ts`
- `apps/backend/src/api/store/google/middlewares/index.ts`
- `apps/backend/src/api/store/google/places/photo/route.ts`
- `apps/backend/src/api/store/google/places/route.ts`
- `apps/backend/src/links/product-sales-policy.ts`
- `apps/backend/src/modules/product-sales-policy/index.ts`
- `apps/backend/src/modules/product-sales-policy/models/product-sales-policy.ts`
- `apps/backend/src/modules/product-sales-policy/service.ts`
- `apps/backend/src/modules/zero-cost-fulfillment/index.ts`
- `apps/backend/src/modules/zero-cost-fulfillment/service.ts`
- `apps/backend/src/workflows/audit/steps.ts`
- `apps/backend/src/workflows/orders/refund-frigga-order.ts`
- `apps/backend/src/workflows/orders/steps.ts`
- `apps/backend/src/workflows/payments/process-mercado-pago-webhook.ts`
- `apps/backend/src/workflows/payments/steps.ts`
- `apps/backend/src/workflows/setup-customer/index.ts`

Assets (46):

- `imgs/brands/bitzer.webp`, `imgs/brands/coel.webp`, `imgs/brands/siccom.webp`
- `imgs/carrosel1.png`, `imgs/carrosel2.png`, `imgs/carrosel3.png`,
  `imgs/carrosel4.png`, `imgs/carrosel5.png`
- `imgs/favicon-friggafrio.png`, `imgs/logo-friggafrio.png`
- `imgs/products/bombas-de-vacuo/bomba-de-vacuo.png`
- `imgs/products/cilindros/cilindro-para-preenchemento.png`
- `imgs/products/controladores/controladores-de-tempaturas.png`
- `imgs/products/ferramentas/ferramentas.png`
- `imgs/products/filtros-secadores/monitores-de-tesao-e-valvulas-de-pressao.png`
- `imgs/products/gases-refrigerantes/gases-refrigerantes.png`
- `imgs/products/isolamentos/isolamento.png`
- `imgs/products/oleos-quimicos/oleo-lubrificante-mineral.png`
- `imgs/products/quadros-de-comando/quadros-de-comando.png`
- `imgs/products/tubos-de-cobre/tubo-de-cobre.png`
- `imgs/products/unidades-condensadoras/unidade-condesadoras.png`
- `imgs/products/valvulas-controles/nanometros.png`
- `imgs/team/originals/ana-carolina.png`, `imgs/team/originals/camila.jpg`
- `imgs/team/originals/daniel.png`, `imgs/team/originals/douglas.png`
- `imgs/team/originals/eduardo-medeiros.png`, `imgs/team/originals/ernane-mascarenhas.png`
- `imgs/team/originals/francisco-lima.png`, `imgs/team/originals/josefa-de-lima-silva.jpg`
- `imgs/team/originals/kaio.png`, `imgs/team/originals/kaka.png`
- `imgs/team/originals/lucas.png`, `imgs/team/originals/natalia-coelho.png`
- `imgs/team/originals/paulo-neulaender.png`, `imgs/team/originals/paulo.png`
- `imgs/team/originals/rafaela.png`, `imgs/team/originals/ricardo-lopes.png`
- `imgs/team/originals/roberto.png`, `imgs/team/originals/rodrigo-lopes.png`
- `imgs/team/originals/rodrigo-spagnolo.png`, `imgs/team/originals/sidnei.png`
- `imgs/team/originals/tita-arantes.png`, `imgs/team/originals/victor.png`
- `imgs/team/originals/vitor.png`, `imgs/team/originals/william.png`

### 2. Testes — 7

- `apps/backend/src/__tests__/audit_webhook_attack.unit.spec.ts`
- `apps/backend/src/__tests__/security.unit.spec.ts`
- `test-e2e.sh`
- `test-fix-links.js`
- `test-step.js`
- `test-step.ts`
- `test.js`

### 3. Migrations — 2

- `apps/backend/src/modules/product-sales-policy/migrations/.snapshot-product-sales-policy.json`
- `apps/backend/src/modules/product-sales-policy/migrations/Migration20260725033401.ts`

### 4. Scripts necessários ou candidatos — 25

- `apps/backend/check-ff.ts`
- `apps/backend/check-shipping.ts`
- `apps/backend/create-br-region.ts`
- `apps/backend/create-br-shipping.ts`
- `apps/backend/create-price-set.ts`
- `apps/backend/create-shipping-option.ts`
- `apps/backend/link-providers-remote.ts`
- `apps/backend/set-shipping-price-simple-remote.ts`
- `apps/backend/update-service-zone.ts`
- `apps/backend/update_onSubmitCompany.js`
- `apps/backend/update_onSubmitPerson.js`
- `apps/backend/src/migration-scripts/force-products-seed.ts`
- `apps/backend/src/scripts/audit-products.ts`
- `apps/backend/src/scripts/find-frigga-store-place-ids.ts`
- `apps/backend/src/scripts/repair-friggafrio-gas-inventory.ts`
- `apps/backend/src/scripts/repair-friggafrio-sellable-catalog.ts`
- `apps/backend/src/scripts/seed-frigga-demo-catalog.ts`
- `apps/backend/src/scripts/seed-frigga-real-products.ts`
- `apps/backend/src/scripts/seed-prices-manual.ts`
- `scripts/check-storefront-links.mjs`
- `scripts/import-official-team-images.mjs`
- `scripts/validate-team-assets.mjs`
- `deploy/init-letsencrypt.sh`
- `deploy/run_wsl_vpn.sh`
- `deploy/setup_cloudflare_tunnel.sh`

### 5. Configuração — 2

- `deploy/docker-compose.tunnel.yml`
- `deploy/nginx/nginx.conf`

### 6. Documentação útil ou candidata — 14

- `apps/docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-BASELINE.md`
- `apps/docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-FULL-FIX-CHECKLIST.md`
- `apps/docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-FULL-FIX-FINAL.md`
- `apps/docs/auth/CUSTOMER-REGISTRATION-BASELINE.md`
- `apps/docs/fixes/REPORT-API-HYDRATION.md`
- `deploy/README.md`
- `docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-BASELINE.md`
- `docs/audit/LINKS-ROUTES-CART-FULL-FIX-CHECKLIST.md`
- `docs/audit/LINKS-ROUTES-CART-FULL-FIX-FINAL.md`
- `docs/cart/ADD-TO-CART-BASELINE.md`
- `docs/commerce/CURRENT-PRODUCT-INVENTORY.md`
- `docs/commerce/PRODUCT-SALES-UI-BASELINE.md`
- `docs/commerce/PRODUCT-SALES-UI-FINAL.md`
- `imgs/products/README.md`

### 8. Relatórios gerados — 3

- `RELATORIO_FINAL_CATALOGO.md`
- `checkout_audit_report.txt`
- `apps/backend/test-results/.last-run.json`

### 10. Temporário — 1

- `temp_index.html` — 329443 bytes

### 11. Possível segredo — 2

- `apps/backend/test-db.js`
- `apps/backend/test-db2.js`

Esses arquivos contêm padrão de credencial de banco. O valor não foi registrado neste
documento. Eles não devem ser versionados sem sanitização.

### 13. Cache/lock local — 1

- `.claude/scheduled_tasks.lock`

### 14. Patches/scripts temporários — 12

- `fix-cart-button.sh`
- `fix-cart-drawer-button.sh`
- `fix-cart-provider.js`
- `fix-cart-tsx.js`
- `fix-cart-tsx.sh`
- `fix-footer-links.js`
- `fix-store-selection.js`
- `fix-undefined-links.js`
- `getPurchasableVariant.ts`
- `update-card.js`
- `update-cart-components.sh`
- `update-test.js`

## Tamanhos e concentração

- Os 136 tamanhos individuais foram coletados com `Get-Item` durante a fotografia.
- Maiores concentrações: originais da equipe e imagens do carrossel, frequentemente
  entre 1 MB e 2,4 MB por arquivo.
- `imgs/favicon-friggafrio.png`: 1385770 bytes, inadequado como favicon final.
- `imgs/logo-friggafrio.png`: 2128621 bytes.
- `temp_index.html`: 329443 bytes.
- Código, migrations e documentação estão abaixo de 14 KB por arquivo nesta amostra.

O inventário nominal acima contém todos os 136 caminhos e permite cruzamento com a
captura de tamanhos da sessão. A Fase 5 produzirá a tabela definitiva por arquivo com
decisão de versionar, ignorar ou remover.

## Possíveis segredos

Uma busca somente por nomes/padrões, sem imprimir valores, encontrou correspondência em
9 arquivos não rastreados:

- `RELATORIO_FINAL_CATALOGO.md`
- `apps/backend/src/__tests__/security.unit.spec.ts`
- `apps/backend/src/api/store/customers/middlewares.ts`
- `apps/backend/src/workflows/setup-customer/index.ts`
- `apps/backend/test-db.js`
- `apps/backend/update_onSubmitCompany.js`
- `apps/backend/update_onSubmitPerson.js`
- `deploy/README.md`
- `temp_index.html`

Correspondência não prova vazamento; a Fase 5 distinguirá exemplo, nome de campo,
placeholder e credencial real. Os `.env` ignorados são tratados como sensíveis e seus
conteúdos não foram impressos.

## Código de produção fora do Git

Foram identificados pelo menos 21 arquivos de backend não rastreados, incluindo rotas
Admin/Store, autenticação Google, política de venda, fulfillment, auditoria, pedidos,
pagamentos e setup de cliente. Um build/deploy obtido somente do commit atual pode não
conter esses fluxos.

## Comandos executados

```text
git status --short
git status
git branch --show-current
git log -1 --oneline
git diff --stat
git diff --no-ext-diff --no-color
git ls-files --others --exclude-standard
git status --short --ignored
node --version
pnpm --version
pnpm -r list --depth -1
```

## Restrições desta fase

- Nenhum `git add`, commit, remoção ou limpeza foi executado.
- Nenhum valor de segredo foi incluído na evidência.
- Nenhuma correção funcional foi aplicada.
