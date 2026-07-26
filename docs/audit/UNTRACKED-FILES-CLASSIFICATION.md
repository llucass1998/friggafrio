# FriggaFrio — Classificação de arquivos não rastreados

Data da fotografia: 2026-07-26
Quantidade da fotografia anterior ao ajuste do `.gitignore`: **149 arquivos**
`git add -A` executado: **não**
Versionamento seletivo: **99 caminhos adicionados explicitamente ao índice**, incluindo
os 58 arquivos aprovados nesta tabela, alterações rastreadas e os artefatos desta fase.

A classificação preserva código, migrations, testes, configurações e documentação
necessários. `Remover` significa exclusão após migração/revisão quando indicada; nenhum
arquivo do usuário foi apagado em massa.

## Resumo

- Devem ser versionados seletivamente: 58.
- Devem ser ignorados como artefato/local: 50.
- Devem ser removidos, migrados ou reimplementados: 45.
- Possível segredo em arquivo não rastreado: 3.
- Assets com dado pessoal, fora do Git: 24.

## Inventário individual

| Caminho | Bytes | Categoria | Versionar | Ignorar | Remover | Segredo | Justificativa |
|---|---:|---|---|---|---|---|---|
| `.claude/scheduled_tasks.lock` | 124 | Cache de ferramenta | Não | Sim | Sim | Não | Lock local gerado automaticamente. |
| `apps/backend/check-ff.ts` | 573 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/check-shipping.ts` | 605 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/create-br-region.ts` | 446 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/create-br-shipping.ts` | 797 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/create-price-set.ts` | 813 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/create-shipping-option.ts` | 1288 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/link-providers-remote.ts` | 676 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/set-shipping-price-simple-remote.ts` | 862 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/src/__tests__/audit_webhook_attack.unit.spec.ts` | 2873 | Teste automatizado | Sim | Não | Não | Não | Teste de regressão necessário. |
| `apps/backend/src/__tests__/catalog-repair.unit.spec.ts` | 1266 | Teste automatizado | Sim | Não | Não | Não | Teste de regressão necessário. |
| `apps/backend/src/__tests__/payment-containment.unit.spec.ts` | 1724 | Teste automatizado | Sim | Não | Não | Não | Teste de regressão necessário. |
| `apps/backend/src/__tests__/security.unit.spec.ts` | 3470 | Teste automatizado | Sim | Não | Não | Não | Teste de regressão necessário. |
| `apps/backend/src/api/admin/audit-logs/route.ts` | 578 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/admin/orders/[id]/refund/route.ts` | 1155 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/auth/customer/google/route.ts` | 6406 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/middlewares/payment-containment.ts` | 602 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/middlewares/validate-demo-price.ts` | 1319 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/store/customers/middlewares.ts` | 603 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/store/customers/register/route.ts` | 502 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/store/google/middlewares/index.ts` | 362 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/store/google/places/photo/route.ts` | 1649 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/api/store/google/places/route.ts` | 1978 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/links/product-sales-policy.ts` | 337 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/migration-scripts/force-products-seed.ts` | 5606 | Script de dados não homologado | Não | Não | Sim/quarentena | Não | Contém carga/inventário/preço não aprovado; proibido em produção. |
| `apps/backend/src/modules/product-sales-policy/index.ts` | 266 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/modules/product-sales-policy/migrations/.snapshot-product-sales-policy.json` | 4839 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/modules/product-sales-policy/migrations/Migration20260725033401.ts` | 1055 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/modules/product-sales-policy/models/product-sales-policy.ts` | 345 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/modules/product-sales-policy/service.ts` | 216 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/modules/zero-cost-fulfillment/index.ts` | 296 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/modules/zero-cost-fulfillment/service.ts` | 2503 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/scripts/audit-products.ts` | 1588 | Script operacional seguro | Sim | Não | Não | Não | Leitura ou reparo fail-closed revisado. |
| `apps/backend/src/scripts/find-frigga-store-place-ids.ts` | 2059 | Script operacional seguro | Sim | Não | Não | Não | Leitura ou reparo fail-closed revisado. |
| `apps/backend/src/scripts/repair-friggafrio-gas-inventory.ts` | 3365 | Script de dados não homologado | Não | Não | Sim/quarentena | Não | Contém carga/inventário/preço não aprovado; proibido em produção. |
| `apps/backend/src/scripts/repair-friggafrio-sellable-catalog.ts` | 4795 | Script operacional seguro | Sim | Não | Não | Não | Leitura ou reparo fail-closed revisado. |
| `apps/backend/src/scripts/seed-frigga-demo-catalog.ts` | 13271 | Script de dados não homologado | Não | Não | Sim/quarentena | Não | Contém carga/inventário/preço não aprovado; proibido em produção. |
| `apps/backend/src/scripts/seed-frigga-real-products.ts` | 7365 | Script de dados não homologado | Não | Não | Sim/quarentena | Não | Contém carga/inventário/preço não aprovado; proibido em produção. |
| `apps/backend/src/scripts/seed-prices-manual.ts` | 595 | Script de dados não homologado | Não | Não | Sim/quarentena | Não | Contém carga/inventário/preço não aprovado; proibido em produção. |
| `apps/backend/src/utils/payment-availability.ts` | 1418 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/workflows/audit/steps.ts` | 894 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/workflows/orders/refund-frigga-order.ts` | 978 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/workflows/orders/steps.ts` | 917 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/workflows/payments/process-mercado-pago-webhook.ts` | 882 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/workflows/payments/steps.ts` | 2727 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/src/workflows/setup-customer/index.ts` | 2374 | Código backend | Sim | Não | Não | Não | Fonte, workflow, módulo ou migration necessária ao backend. |
| `apps/backend/test-db.js` | 277 | Script temporário de banco | Não | Não | Sim | Potencial | Configuração local de banco; substituir por teste oficial. |
| `apps/backend/test-db2.js` | 450 | Script temporário de banco | Não | Não | Sim | Potencial | Configuração local de banco; substituir por teste oficial. |
| `apps/backend/test-results/.last-run.json` | 45 | Resultado de teste | Não | Sim | Sim | Não | Artefato gerado; não é fonte. |
| `apps/backend/update_onSubmitCompany.js` | 2856 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/backend/update_onSubmitPerson.js` | 1697 | Patch temporário | Não | Não | Sim | Potencial | Manipula cadastro/senha fora do fluxo oficial. |
| `apps/backend/update-service-zone.ts` | 1096 | Script avulso backend | Não | Não | Sim/reimplementar | Não | Mover para src/scripts com tipos/workflow ou descartar. |
| `apps/docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-BASELINE.md` | 1053 | Documentação mal posicionada | Não | Não | Sim após migração | Não | Mover/consolidar em docs antes de remover a duplicata. |
| `apps/docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-FULL-FIX-CHECKLIST.md` | 3292 | Documentação mal posicionada | Não | Não | Sim após migração | Não | Mover/consolidar em docs antes de remover a duplicata. |
| `apps/docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-FULL-FIX-FINAL.md` | 4211 | Documentação mal posicionada | Não | Não | Sim após migração | Não | Mover/consolidar em docs antes de remover a duplicata. |
| `apps/docs/auth/CUSTOMER-REGISTRATION-BASELINE.md` | 1943 | Documentação mal posicionada | Não | Não | Sim após migração | Não | Mover/consolidar em docs antes de remover a duplicata. |
| `apps/docs/fixes/REPORT-API-HYDRATION.md` | 2835 | Documentação mal posicionada | Não | Não | Sim após migração | Não | Mover/consolidar em docs antes de remover a duplicata. |
| `apps/storefront/src/lib/config/payment-availability.ts` | 650 | Código de produção | Sim | Não | Não | Não | Fonte necessária ao build do storefront. |
| `apps/storefront/src/lib/context/auth-context-value.ts` | 561 | Código de produção | Sim | Não | Não | Não | Fonte necessária ao build do storefront. |
| `checkout_audit_report.txt` | 1770 | Relatório gerado | Não | Sim | Sim | Não | Saída temporária já substituída por documentação. |
| `deploy/docker-compose.tunnel.yml` | 250 | Configuração operacional | Sim | Não | Não | Não | Necessário para infraestrutura; usa referências de ambiente. |
| `deploy/init-letsencrypt.sh` | 2740 | Configuração operacional | Sim | Não | Não | Não | Necessário para infraestrutura; usa referências de ambiente. |
| `deploy/nginx/nginx.conf` | 882 | Configuração operacional | Sim | Não | Não | Não | Necessário para infraestrutura; usa referências de ambiente. |
| `deploy/README.md` | 1678 | Configuração operacional | Sim | Não | Não | Não | Necessário para infraestrutura; usa referências de ambiente. |
| `deploy/run_wsl_vpn.sh` | 867 | Configuração operacional | Sim | Não | Não | Não | Necessário para infraestrutura; usa referências de ambiente. |
| `deploy/setup_cloudflare_tunnel.sh` | 1322 | Configuração operacional | Sim | Não | Não | Não | Necessário para infraestrutura; usa referências de ambiente. |
| `docs/audit/FRIGGAFRIO-RECOVERY-BASELINE.md` | 2458 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/audit/FRIGGAFRIO-RECOVERY-FINAL-REPORT.md` | 4284 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/audit/FRIGGAFRIO-RECOVERY-MASTER-CHECKLIST.md` | 25749 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/audit/FRIGGAFRIO-SELLABLE-CATALOG-CART-BASELINE.md` | 971 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/audit/GIT-BASELINE.md` | 11388 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/audit/LINKS-ROUTES-CART-FULL-FIX-CHECKLIST.md` | 1330 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/audit/LINKS-ROUTES-CART-FULL-FIX-FINAL.md` | 1568 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/backend/BACKEND-BUILD-RECOVERY.md` | 2803 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/cart/ADD-TO-CART-BASELINE.md` | 2556 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/commerce/CURRENT-PRODUCT-INVENTORY.md` | 3273 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/commerce/PRODUCT-SALES-UI-BASELINE.md` | 4380 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/commerce/PRODUCT-SALES-UI-FINAL.md` | 1720 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/frontend/STOREFRONT-TYPESCRIPT-RECOVERY.md` | 4334 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `docs/security/PAYMENT-CONTAINMENT.md` | 2487 | Documentação essencial | Sim | Não | Não | Não | Evidência ou especificação necessária à recuperação. |
| `fix-cart-button.sh` | 281 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-cart-drawer-button.sh` | 618 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-cart-provider.js` | 821 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-cart-tsx.js` | 770 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-cart-tsx.sh` | 374 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-footer-links.js` | 4912 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-store-selection.js` | 2679 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `fix-undefined-links.js` | 1983 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `getPurchasableVariant.ts` | 1039 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `imgs/brands/bitzer.webp` | 55470 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/brands/coel.webp` | 28595 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/brands/siccom.webp` | 38994 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/carrosel1.png` | 2186222 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/carrosel2.png` | 1616088 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/carrosel3.png` | 1868914 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/carrosel4.png` | 1818572 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/carrosel5.png` | 2247700 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/favicon-friggafrio.png` | 1385770 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/logo-friggafrio.png` | 2128621 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/bombas-de-vacuo/bomba-de-vacuo.png` | 129923 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/cilindros/cilindro-para-preenchemento.png` | 128529 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/controladores/controladores-de-tempaturas.png` | 120619 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/ferramentas/ferramentas.png` | 153611 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/filtros-secadores/monitores-de-tesao-e-valvulas-de-pressao.png` | 127585 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/gases-refrigerantes/gases-refrigerantes.png` | 121628 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/isolamentos/isolamento.png` | 124910 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/oleos-quimicos/oleo-lubrificante-mineral.png` | 142095 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/quadros-de-comando/quadros-de-comando.png` | 126534 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/README.md` | 2008 | Documentação de assets | Sim | Não | Não | Não | Instrução essencial para ingestão de imagens. |
| `imgs/products/tubos-de-cobre/tubo-de-cobre.png` | 120783 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/unidades-condensadoras/unidade-condesadoras.png` | 173805 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/products/valvulas-controles/nanometros.png` | 133440 | Asset-fonte local | Não | Sim | Não | Não | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/ana-carolina.png` | 1839233 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/camila.jpg` | 86478 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/daniel.png` | 1639894 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/douglas.png` | 1545566 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/eduardo-medeiros.png` | 1596689 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/ernane-mascarenhas.png` | 1234162 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/francisco-lima.png` | 1855824 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/josefa-de-lima-silva.jpg` | 92522 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/kaio.png` | 2228352 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/kaka.png` | 1628678 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/lucas.png` | 1993313 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/natalia-coelho.png` | 2436370 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/paulo.png` | 1349321 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/paulo-neulaender.png` | 377511 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/rafaela.png` | 1619063 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/ricardo-lopes.png` | 1423345 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/roberto.png` | 2366198 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/rodrigo-lopes.png` | 2322013 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/rodrigo-spagnolo.png` | 1459742 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/sidnei.png` | 2084285 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/tita-arantes.png` | 2081251 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/victor.png` | 1252293 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/vitor.png` | 2427860 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `imgs/team/originals/william.png` | 2232900 | Asset-fonte local | Não | Sim | Não | Não; dado pessoal | Cópia otimizada já está no public; preservar localmente, fora do Git. |
| `RELATORIO_FINAL_CATALOGO.md` | 7828 | Relatório fora do padrão | Não | Não | Sim após migração | Não | Consolidar em docs/catalog; não versionar na raiz. |
| `scripts/check-storefront-links.mjs` | 1612 | Script de manutenção | Sim | Não | Não | Não | Script reproduzível necessário ao projeto. |
| `scripts/import-official-team-images.mjs` | 6629 | Script de manutenção | Sim | Não | Não | Não | Script reproduzível necessário ao projeto. |
| `scripts/validate-team-assets.mjs` | 829 | Script de manutenção | Sim | Não | Não | Não | Script reproduzível necessário ao projeto. |
| `temp_index.html` | 329443 | HTML temporário | Não | Sim | Sim | Não | Captura gerada de execução local. |
| `test.js` | 174 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `test-e2e.sh` | 85 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `test-fix-links.js` | 501 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `test-step.js` | 137 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `test-step.ts` | 213 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `update-card.js` | 5928 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `update-cart-components.sh` | 1528 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |
| `update-test.js` | 692 | Scratch/patch temporário | Não | Não | Sim | Não | Alteração deve existir no código/teste oficial, não em patch avulso. |

## Achado rastreado fora da tabela

`apps/storefront/token.txt` não fazia parte dos 149 porque já estava rastreado. O scan
detectou formato JWT de alta confiança; o arquivo foi removido da árvore atual e
bloqueado no `.gitignore`. O token continua no histórico do commit `e576de2`, por isso
revogação/rotação e limpeza coordenada do histórico são obrigatórias.

## Próximas ações de versionamento

1. Revisar o diff já preparado no índice antes de qualquer commit; nenhum commit ou
   push foi executado.
2. Migrar documentação de `apps/docs` e o relatório da raiz para a árvore `docs`.
3. Substituir scripts avulsos por scripts tipados/workflows oficiais antes de removê-los.
4. Manter scripts de dados não homologados fora do release.
5. Rotacionar o token e executar secret scanner dedicado antes de commit/push.

Um snapshot criado exclusivamente a partir do índice passou no install congelado, nos
dois builds, no TypeScript storefront, nos 20 testes backend e no TypeScript backend
após a geração de tipos do Medusa. O lint global storefront continua reprovado.
