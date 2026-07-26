# FriggaFrio — Recovery Master Checklist

Última atualização: 2026-07-26 01:14:08 -03:00
Responsável técnico: IDE Agent
Estado de liberação: **SISTEMA NÃO LIBERADO PARA VENDA REAL**

## Legenda

- [ ] Pendente
- [~] Em andamento
- [x] Finalizado
- [!] Bloqueado
- [x] Reprovado

Uma fase só pode ser marcada como finalizada quando suas evidências, comandos, resultados,
arquivos alterados, testes e horário constarem no respectivo check-in. Compilação isolada
não comprova funcionamento.

## Gate de venda real

- [ ] Todos os itens P0 finalizados.
- [ ] Frontend e backend sem erros de TypeScript.
- [ ] Builds, lint, unitários, integração e E2E verdes.
- [ ] Migrations homologadas em banco vazio e cópia de banco existente.
- [ ] Catálogo, preço, estoque e frete reais e aprovados.
- [ ] Gateway sandbox, webhook, idempotência e conciliação aprovados.
- [ ] Backup restaurado e rollback testado.
- [ ] Staging homologado.
- [x] `PAYMENTS_ENABLED=false` deve permanecer como padrão até a aprovação dos gates.
- [x] `PAYMENT_PROVIDER_ENABLED=false` deve permanecer como padrão até a aprovação dos gates.

## P0 — Segurança, reprodutibilidade e fundação

### Fase 0 — Controle mestre

- [x] Criar o checklist mestre.
- [x] Criar o baseline de recuperação.
- [x] Criar o relatório final evolutivo.
- [x] Registrar check-in e evidências.

### Fase 1 — Fotografia inicial do repositório

- [x] Registrar Git, branch, commit, diff e worktree.
- [x] Inventariar os 136 arquivos não rastreados, seus tamanhos e categorias.
- [x] Registrar arquivos ignorados e possíveis segredos sem expor valores.
- [x] Registrar Node, pnpm e nomes reais dos workspaces.
- [x] Criar `docs/audit/GIT-BASELINE.md`.

### Fase 2 — Contenção imediata de pagamento

- [x] Localizar todos os caminhos que alteram estado de pagamento.
- [x] Bloquear confirmação arbitrária e sucesso falso.
- [x] Aplicar feature flags seguras com padrão desabilitado.
- [x] Bloquear a interface de cobrança, preservando orçamento.
- [x] Gate da fase reprovado: backend build, TypeScript/lint storefront e navegador
      ainda não foram aprovados.

### Fase 3 — Build do backend

- [x] Corrigir a causa raiz dos erros TypeScript.
- [x] Tornar o script de reparo dry-run por padrão, aplicável e idempotente.
- [x] Classificar warnings sem ocultá-los.
- [x] Aprovar typecheck, build, unitários e duas execuções dry-run.

### Fase 4 — TypeScript do storefront

- [x] Registrar e classificar todos os erros atuais.
- [x] Corrigir autenticação, carrinho, pedidos, orçamentos e rotas pela causa raiz.
- [ ] Gate reprovado: typecheck/build/SSR passaram, mas lint global e navegação manual
      ainda não foram aprovados.

### Fase 5 — Higiene e versionamento do Git

- [x] Revisar individualmente todos os arquivos não rastreados.
- [x] Separar código, migrations, testes, documentação, temporários e segredos.
- [x] Atualizar `.gitignore` sem ocultar código necessário.
- [x] Executar scan de segredos sem registrar valores.
- [x] Validar instalação e builds a partir apenas do conteúdo versionável.
- [ ] Gate bloqueado: token histórico precisa ser revogado/rotacionado por seu emissor.

### Fase 6 — CI obrigatório

- [x] Criar jobs de qualidade, backend, storefront, integração, E2E e segurança.
- [x] Usar install congelado e falhar em qualquer gate obrigatório.
- [x] Validar a sintaxe e provar que falhas reprovam o pipeline.
- [x] Gate da fase: storefront lint tem 527 erros e o histórico ainda contém segredo.

### Fase 7 — Models, workflows e migrations

- [x] Mapear models, tabelas, migrations, workflows, índices e constraints.
- [x] Corrigir divergências críticas de schema e conter workflows/providers falsos.
- [x] Aprovar banco vazio, cópia de banco existente, rollback e ausência de seed.
- [x] Gate da fase: 96 usos preexistentes de `any`/`@ts-ignore` ainda precisam ser eliminados.

### Fase 8 — Estratégia única de autenticação

- [ ] Documentar a estratégia compatível com Medusa v2.
- [ ] Eliminar token de autenticação persistente no `localStorage`.
- [ ] Aprovar cadastro, login, sessão, logout, Google, expiração e carrinho preservado.

### Fase 9 — Matriz de autorização

- [ ] Inventariar rota, método, papel, propriedade, PII, rate limit e teste.
- [ ] Proteger IDOR, pagamentos, Admin, uploads, documentos e webhooks.
- [ ] Aprovar testes entre clientes distintos e papéis distintos.

### Fase 10 — Segurança da aplicação

- [ ] Endurecer CORS, cookies, CSRF, headers, rate limiting, uploads, logs e PII.
- [ ] Aprovar testes de origem, limite, redirect, payload, upload e segredo ausente.

### Fase 11 — Hydration, rotas e links

- [ ] Eliminar divergências SSR/hidratação pela causa raiz.
- [ ] Criar navegação interna tipada e eliminar links inválidos.
- [ ] Aprovar refresh, crawler interno, console e rotas protegidas.

## P1 — Comércio funcional

### Fase 12 — Catálogo real

- [ ] Manter públicos somente os cinco gases autorizados.
- [ ] Não liberar variante sem dados reais e aprovados.
- [ ] Consolidar fonte única de visibilidade, venda e orçamento.

### Fase 13 — Estoque real e concorrência

- [ ] Configurar itens, níveis, locais, reservas e disponibilidade reais.
- [ ] Impedir estoque negativo e aprovar concorrência do último item.

### Fase 14 — Carrinho

- [ ] Corrigir o erro 500 de line item pela stack real.
- [ ] Remover falso positivo de estoque e duplicidade de requisições.
- [ ] Aprovar carrinho visitante, autenticado, refresh e erros de domínio.

### Fase 15 — Checkout sem pagamento real

- [ ] Validar identificação, endereço, recebimento e revisão no backend.
- [ ] Bloquear cobrança e sucesso falso enquanto o provider estiver desabilitado.

### Fase 16 — Frete e recebimento

- [ ] Homologar retirada, entrega própria, zona/CEP, prazo e custo.
- [ ] Não declarar frete grátis sem regra comercial aprovada.

### Fase 17 — Gateway

- [ ] Iniciar somente após P0 aprovado.
- [ ] Integrar apenas o gateway comercialmente aprovado em sandbox.
- [ ] Aprovar status, idempotência e ausência de segredos no frontend.

### Fase 18 — Webhook e conciliação

- [ ] Validar assinatura e payload.
- [ ] Garantir unicidade, idempotência, retry e consulta ao gateway.
- [ ] Aprovar duplicação, ordem, timeout e conciliação.

### Fase 19 — Pedidos

- [ ] Separar estado comercial, pagamento, fulfillment e fiscal.
- [ ] Implementar e testar apenas transições permitidas.

### Fase 20 — Orçamentos

- [ ] Implementar versão, validade, histórico, propriedade e BRL.
- [ ] Preservar WhatsApp sem aprovar pedido ou pagamento automaticamente.

### Fase 21 — Notificações

- [ ] Criar provider seguro e templates transacionais pt-BR.
- [ ] Aprovar retry, deduplicação, destinatário e links.

### Fase 22 — Cancelamento, troca, devolução e RMA

- [ ] Implementar solicitação, elegibilidade, decisão, estorno e estoque.
- [ ] Manter política comercial/jurídica pendente de aprovação.

## P2 — Fiscal, produção e operação

### Fase 23 — Fiscal

- [ ] Preparar modelo e integração futura sem emissão improvisada.
- [!] Homologação de NCM, CEST, CFOP, tributação e empresa depende do responsável fiscal.

### Fase 24 — Storage e uploads

- [ ] Configurar provider aprovado e endurecer MIME, tamanho, path e acesso.
- [ ] Aprovar testes de execução arbitrária, path traversal e autorização.

### Fase 25 — Redis e health checks

- [ ] Conectar Redis efetivamente quando obrigatório.
- [ ] Separar liveness/readiness e verificar dependências reais.

### Fase 26 — Logs, métricas e alertas

- [ ] Adicionar correlação, métricas, tracing/error tracking e alertas.
- [ ] Provar sanitização de PII e segredos.

### Fase 27 — Backup e restauração

- [ ] Criar backup isolado e validar integridade.
- [ ] Restaurar, migrar, iniciar a aplicação e conferir dados principais.

### Fase 28 — Staging, deploy e rollback

- [ ] Automatizar imagem, scan, migration, deploy, smoke e rollback.
- [ ] Homologar DNS, TLS, secrets manager e redes internas.

### Fase 29 — Integração real

- [ ] Exercitar PostgreSQL, Redis, autenticação, comércio, autorização e migrations.
- [ ] Usar infraestrutura de teste isolada e determinística.

### Fase 30 — Playwright E2E

- [ ] Corrigir causa dos timeouts e falhas sem sleeps artificiais.
- [ ] Aprovar B2C, Admin e segurança com dados determinísticos.

### Fase 31 — Performance e chunks

- [ ] Medir bundle anterior e posterior.
- [ ] Aplicar divisão de código sem prejudicar SSR.

### Fase 32 — Conteúdo, políticas e LGPD

- [ ] Corrigir pt-BR, contatos e políticas apenas com dados confirmados.
- [ ] Versionar aceite e implementar direitos/retenção/consentimento.
- [!] Conteúdo jurídico depende de validação profissional.

### Fase 33 — Homologação final

- [ ] Executar todos os gates em staging.
- [ ] Aprovar o fluxo B2C sandbox completo.
- [ ] Atualizar o relatório final e registrar a decisão de aptidão.

## Evidências concluídas

- Fase 0: quatro arquivos obrigatórios presentes, não vazios; 34 fases enumeradas sem
  lacunas; relatório final contém os 55 tópicos obrigatórios e mantém `NÃO APTO`.
- Fase 1: 136 de 136 caminhos originais documentados; branch, commit, diff, ambiente,
  ignorados e possíveis segredos registrados sem expor valores.
- Verificação comum: `git diff --check` retornou exit code 0.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 0 — Criar controle mestre
PRIORIDADE: P0
STATUS: FINALIZADA

OBJETIVO DA FASE: Criar os três controles evolutivos da recuperação.

BASELINE ANTERIOR: Os arquivos obrigatórios não existiam.

ARQUIVOS ANALISADOS: Prompt integral de recuperação e estrutura `docs/audit`.

ARQUIVOS ALTERADOS: `FRIGGAFRIO-RECOVERY-MASTER-CHECKLIST.md`,
`FRIGGAFRIO-RECOVERY-BASELINE.md`, `FRIGGAFRIO-RECOVERY-FINAL-REPORT.md`.

MIGRATIONS: Nenhuma.

COMANDOS EXECUTADOS: `Test-Path`, validações PowerShell de presença, conteúdo, fases e
tópicos, `git diff --check`, `git status --short`.

TESTES EXECUTADOS: 4/4 arquivos presentes e não vazios; 34/34 fases; 55/55 tópicos do
relatório; decisão `NÃO APTO` confirmada.

RESULTADO DO LINT: Não aplicável; somente Markdown foi alterado.

RESULTADO DO TYPESCRIPT: Não aplicável; nenhum workspace de código foi alterado.

RESULTADO DO BUILD: Não aplicável; nenhum artefato executável foi alterado.

RESULTADO DOS TESTES UNITÁRIOS: Não aplicável.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Não aplicável.

RESULTADO DO E2E: Não aplicável.

RESULTADO MANUAL NO NAVEGADOR: Não aplicável.

RESULTADO DO BACKEND: Não alterado.

RESULTADO DO BANCO: Não alterado.

RESULTADO DE SEGURANÇA: Venda real explicitamente bloqueada no checklist e relatório.

PROBLEMAS ENCONTRADOS: Controles mestres inexistentes.

CAUSA RAIZ: A auditoria anterior não havia aplicado alterações.

CORREÇÕES APLICADAS: Criação dos controles com legenda, gates, fases e relatório
evolutivo.

EVIDÊNCIAS: Validações retornaram `MISSING=0`, `EMPTY=0`, `PHASE_HEADINGS=34`,
`REPORT_ITEMS=55` e `NOT_APT=True`.

ITENS MARCADOS NO CHECKLIST: Todos os itens da Fase 0.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: Os três arquivos obrigatórios da Fase 0.

PENDÊNCIAS: Executar as Fases 2–33.

BLOQUEIOS EXTERNOS: Nenhum para esta fase.

REGRESSÕES ENCONTRADAS: Nenhuma.

REGRESSÕES CORRIGIDAS: Nenhuma.

PRÓXIMA FASE: Fase 1 concluída em conjunto após a fotografia anterior às escritas;
prosseguir para a Fase 2.

CRITÉRIO DE FINALIZAÇÃO: A fase é 100% finalizada porque todos os documentos exigidos
existem, não estão vazios e suas estruturas obrigatórias foram verificadas depois da
última alteração.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 1 — Fotografia inicial do repositório
PRIORIDADE: P0
STATUS: FINALIZADA

OBJETIVO DA FASE: Registrar o estado Git e classificar todos os não rastreados antes de
qualquer correção de código.

BASELINE ANTERIOR: `main` em `e576de2`, worktree sujo e inventário não consolidado.

ARQUIVOS ANALISADOS: Todos os caminhos retornados pelo Git, manifests dos três
workspaces, workspace pnpm e `.gitignore`.

ARQUIVOS ALTERADOS: `docs/audit/GIT-BASELINE.md` e atualização destes controles.

MIGRATIONS: Duas migrations não rastreadas foram inventariadas; nenhuma foi executada.

COMANDOS EXECUTADOS: `git status --short`, `git status`, `git branch --show-current`,
`git log -1 --oneline`, `git diff --stat`, `git diff --no-ext-diff --no-color`,
`git ls-files --others --exclude-standard`, `git status --short --ignored`,
`node --version`, `pnpm --version`, `pnpm -r list --depth -1`, inventário de tamanhos e
busca redigida por padrões sensíveis.

TESTES EXECUTADOS: Cruzamento automático entre o Git e o baseline.

RESULTADO DO LINT: Não aplicável; somente documentação.

RESULTADO DO TYPESCRIPT: Não aplicável; nenhum código foi alterado.

RESULTADO DO BUILD: Não aplicável; esta fase preserva a fotografia anterior aos builds.

RESULTADO DOS TESTES UNITÁRIOS: Não executados; nenhum código foi alterado.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Não executados; banco não foi alterado.

RESULTADO DO E2E: Não executado; frontend não foi alterado.

RESULTADO MANUAL NO NAVEGADOR: Não aplicável.

RESULTADO DO BACKEND: Não alterado.

RESULTADO DO BANCO: Não alterado.

RESULTADO DE SEGURANÇA: Nove arquivos sinalizados por padrões sem expor valores; dois
scripts de banco classificados como possível segredo.

PROBLEMAS ENCONTRADOS: 4 modificados, 136 não rastreados, código de produção fora do
Git, diferença pnpm 9.4.0/10.12.3 e caminhos longos em dependências.

CAUSA RAIZ: Acúmulo de artefatos, scripts e funcionalidades fora do índice do Git.

CORREÇÕES APLICADAS: Nenhuma correção/limpeza, conforme regra de preservar e classificar
antes de agir; baseline nominal criado.

EVIDÊNCIAS: `ORIGINAL_UNTRACKED=136`, `DOCUMENTED_PATHS=136`, `MISSING_PATHS=0`;
Node `v24.15.0`; workspaces `ai-template`, `backend` e `storefront`.

ITENS MARCADOS NO CHECKLIST: Todos os itens da Fase 1.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `docs/audit/GIT-BASELINE.md`.

PENDÊNCIAS: Decisão individual de versionar/ignorar/remover será tomada na Fase 5.

BLOQUEIOS EXTERNOS: Nenhum para esta fase.

REGRESSÕES ENCONTRADAS: Nenhuma.

REGRESSÕES CORRIGIDAS: Nenhuma.

PRÓXIMA FASE: Fase 2 — contenção imediata de pagamento.

CRITÉRIO DE FINALIZAÇÃO: A fase é 100% finalizada porque todos os comandos de
fotografia foram executados antes de correções, os 136 caminhos foram classificados e o
cruzamento automatizado comprovou que nenhum caminho original ficou ausente.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 2 — Contenção imediata de pagamento
PRIORIDADE: P0
STATUS: REPROVADA

OBJETIVO DA FASE: Impedir confirmação arbitrária, sessão/captura e sucesso falso
enquanto os providers não estiverem homologados.

BASELINE ANTERIOR: Rota customer-facing chamava `markPaymentCollectionAsPaid`; provider
Mercado Pago retornava `authorized`; pagamento manual concluía o carrinho.

ARQUIVOS ANALISADOS: Configuração Medusa, provider Mercado Pago, middlewares, rotas
customizadas, hooks e componentes de pagamento/checkout/pedidos.

ARQUIVOS ALTERADOS: Utilitário e middleware de contenção, rotas de pagamento, config
Medusa, envs, compose, hooks/componentes/páginas do storefront, teste de contenção,
ajuste determinístico do teste criptográfico e documentação.

MIGRATIONS: Nenhuma.

COMANDOS EXECUTADOS: buscas `rg`, unitários focados e completos, TypeScript backend e
storefront, build backend e storefront, ESLint storefront, servidor Medusa local,
health/calls HTTP, `docker compose ps` e tentativa de navegador integrado.

TESTES EXECUTADOS: 4/4 unitários focados; 16/16 unitários backend; health `200`;
criação de sessão `503`; complete cart `503`; busca estática sem workflow de marcação.

RESULTADO DO LINT: Backend executado no build com 82 warnings e 0 errors; storefront
reprovado com 680 ocorrências (564 errors e 116 warnings) preexistentes.

RESULTADO DO TYPESCRIPT: Backend reprovado somente no script
`repair-friggafrio-sellable-catalog.ts`; storefront reprovado com os 12 erros de
baseline após a correção da regressão introduzida nesta fase.

RESULTADO DO BUILD: Backend reprovado no script de catálogo; storefront client/SSR
aprovado.

RESULTADO DOS TESTES UNITÁRIOS: 5 suites, 16 testes, todos aprovados após corrigir a
adulteração não determinística do teste criptográfico.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Verificação HTTP local parcial aprovada; suíte formal
de integração ainda não executada/homologada.

RESULTADO DO E2E: Não executado nesta fase; baseline E2E permanece reprovado.

RESULTADO MANUAL NO NAVEGADOR: Bloqueado; nenhuma instância de navegador integrado
estava disponível.

RESULTADO DO BACKEND: Runtime iniciou, `/health` retornou `200` e os endpoints padrão
testados retornaram `503`; build permanece reprovado pelo baseline da Fase 3.

RESULTADO DO BANCO: PostgreSQL/Redis locais estavam saudáveis; nenhum pedido ou estado
de pagamento foi alterado.

RESULTADO DE SEGURANÇA: A rota insegura não contém mais
`markPaymentCollectionAsPaid`; provider simulado não é registrado; flags são
fail-closed.

PROBLEMAS ENCONTRADOS: Import relativo inicialmente incorreto (corrigido), teste
criptográfico não determinístico (corrigido), build/TypeScript/lint baselines e
navegador indisponível.

CAUSA RAIZ: Pagamento estava acoplado a caminhos manuais/simulados; gates gerais já
estavam reprovados antes desta fase.

CORREÇÕES APLICADAS: Defesa em profundidade backend, remoção do fluxo manual frontend,
feature flags, quarentena do provider simulado e resposta controlada `503`.

EVIDÊNCIAS: `16 passed`; `HTTP_STATUS=503` para sessão e complete; storefront build
client/SSR aprovado; nenhum listener de teste ficou aberto.

ITENS MARCADOS NO CHECKLIST: Quatro itens implementados; gate final marcado reprovado.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `docs/security/PAYMENT-CONTAINMENT.md`.

PENDÊNCIAS: Recuperar Fases 3 e 4, executar integração formal e repetir o navegador.

BLOQUEIOS EXTERNOS: Navegador integrado indisponível nesta sessão.

REGRESSÕES ENCONTRADAS: Caminho relativo e tipagem de navegação introduzidos durante a
fase.

REGRESSÕES CORRIGIDAS: Ambos foram corrigidos e o TypeScript voltou ao baseline.

PRÓXIMA FASE: Fase 3 para remover o bloqueio de build; depois repetir todos os gates da
Fase 2.

CRITÉRIO DE FINALIZAÇÃO: A fase não pode ser considerada finalizada porque o build
backend, TypeScript/lint storefront e a inspeção visual obrigatória não passaram.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 3 — Build do backend
PRIORIDADE: P0
STATUS: FINALIZADA

OBJETIVO DA FASE: Recuperar typecheck e build do backend sem criar catálogo, preço,
SKU ou disponibilidade comercial fictícios.

BASELINE ANTERIOR: TypeScript e build falhavam no script
`repair-friggafrio-sellable-catalog.ts`, que usava tipos inseguros e aplicava dados
inventados.

ARQUIVOS ANALISADOS: Script de reparo, tipos/workflows Medusa, configuração de scripts,
saída integral do lint/build e testes backend.

ARQUIVOS ALTERADOS: Script de reparo seguro, teste unitário do reparo,
`apps/backend/package.json` e documentação da recuperação.

MIGRATIONS: Nenhuma criada ou executada.

COMANDOS EXECUTADOS: TypeScript backend, suíte unitária completa, build Medusa, lint e
duas execuções posicionais `dry-run` do script.

TESTES EXECUTADOS: 4/4 testes específicos do reparo e 6/6 suites, 20/20 testes
unitários backend.

RESULTADO DO LINT: Aprovado sem erros; 77 warnings preservados e classificados por
regra e prioridade.

RESULTADO DO TYPESCRIPT: Aprovado com `pnpm --filter backend typecheck`, 0 erro.

RESULTADO DO BUILD: Backend e frontend administrativo Medusa compilados com sucesso.

RESULTADO DOS TESTES UNITÁRIOS: 6 suites e 20 testes aprovados.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Não exigidos nesta fase; nenhuma escrita foi
executada.

RESULTADO DO E2E: Não aplicável à recuperação do build backend.

RESULTADO MANUAL NO NAVEGADOR: Não aplicável nesta fase.

RESULTADO DO BACKEND: Artefato de produção gerado com sucesso.

RESULTADO DO BANCO: Duas leituras dry-run idênticas; 97 produtos lidos, 97 mudanças
seguras planejadas, 0 item autorizado ausente e 0 escrita.

RESULTADO DE SEGURANÇA: O modo padrão é somente leitura; `apply` é explícito; o script
não cria produto, SKU ou preço e não habilita compra sem todas as aprovações.

PROBLEMAS ENCONTRADOS: O CLI Medusa rejeita `--dry-run` como opção desconhecida antes
de carregar o script; há 77 advertências técnicas fora da causa do build.

CAUSA RAIZ: Script operacional inseguro e sem tipagem adequada fazia parte da
compilação TypeScript.

CORREÇÕES APLICADAS: Parser de modo seguro, validação Zod, tipos Medusa, escopo
autorizado, plano idempotente e comando oficial `typecheck`.

EVIDÊNCIAS: `20 passed`, `tsc --noEmit` com exit code 0, `Backend build completed
successfully` e duas saídas dry-run idênticas.

ITENS MARCADOS NO CHECKLIST: Todos os quatro itens da Fase 3.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `docs/backend/BACKEND-BUILD-RECOVERY.md`.

PENDÊNCIAS: Tratar os warnings conforme as fases funcionais correspondentes,
priorizando unidade monetária antes de qualquer script de preço.

BLOQUEIOS EXTERNOS: Nenhum para esta fase.

REGRESSÕES ENCONTRADAS: Nenhuma após a correção.

REGRESSÕES CORRIGIDAS: Nenhuma adicional.

PRÓXIMA FASE: Fase 4 — TypeScript do storefront.

CRITÉRIO DE FINALIZAÇÃO: A fase está 100% finalizada porque typecheck, build, testes e
duas execuções dry-run passaram após a última alteração, sem qualquer escrita no banco.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 4 — TypeScript do storefront
PRIORIDADE: P0
STATUS: REPROVADA

OBJETIVO DA FASE: Corrigir pela causa raiz os 12 erros TypeScript do storefront e
validar autenticação, carrinho, pedidos, orçamentos, navegação, SSR e bundle.

BASELINE ANTERIOR: 12 erros distribuídos entre helper de carrinho, união de produto,
contrato de login, modo do SDK e rota inexistente de pedidos.

ARQUIVOS ANALISADOS: Componentes navbar/produto, utilitários de carrinho/produto,
contexto/hook de autenticação, SDK, tipos de orçamento, páginas e árvore TanStack.

ARQUIVOS ALTERADOS: Os arquivos analisados que continham as causas, scripts do
storefront e documentação da recuperação.

MIGRATIONS: Nenhuma.

COMANDOS EXECUTADOS: TypeScript antes/depois, ESLint global e impactado, build Vite
client/SSR e busca por coerções/supressões proibidas.

TESTES EXECUTADOS: Contratos TypeScript de autenticação, carrinho e router; lint dos
arquivos impactados; geração dos bundles client e SSR.

RESULTADO DO LINT: Arquivos impactados aprovados com 0 erro/0 warning; área completa
reprovada com 622 ocorrências (528 erros e 94 warnings).

RESULTADO DO TYPESCRIPT: Aprovado, 0 erro após corrigir os 12 erros de baseline.

RESULTADO DO BUILD: Client e SSR aprovados; chunks principais ainda excedem 500 kB.

RESULTADO DOS TESTES UNITÁRIOS: O storefront não possui runner unitário configurado;
os contratos desta fase foram cobertos pelo compilador e pelo router tipado.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Não executados nesta fase.

RESULTADO DO E2E: Não executado; suíte Playwright será recuperada na Fase 30.

RESULTADO MANUAL NO NAVEGADOR: Bloqueado; nenhuma instância do navegador integrado
está disponível.

RESULTADO DO BACKEND: Não alterado nesta fase.

RESULTADO DO BANCO: Não alterado nesta fase.

RESULTADO DE SEGURANÇA: Estratégia alinhada para sessão; logs que exibiam cookies foram
removidos; nenhuma supressão TypeScript ou `any` foi adicionada.

PROBLEMAS ENCONTRADOS: Lint global massivamente reprovado e navegador indisponível.

CAUSA RAIZ: Imports ausentes, contrato antigo do SDK e navegação apontando para uma
rota que nunca existiu na árvore gerada.

CORREÇÕES APLICADAS: Imports reais, união discriminada correta, sessão SDK, narrowing
do login, contexto/hook separados e rota canônica de pedidos.

EVIDÊNCIAS: `tsc --noEmit` exit 0; lint impactado exit 0; 3551 módulos client e 417
módulos SSR transformados; build exit 0.

ITENS MARCADOS NO CHECKLIST: Inventário e correções concluídos; gate geral pendente.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `docs/frontend/STOREFRONT-TYPESCRIPT-RECOVERY.md`.

PENDÊNCIAS: Recuperar o lint na Fase 11 e repetir a validação manual quando o navegador
integrado estiver disponível.

BLOQUEIOS EXTERNOS: Navegador integrado indisponível nesta sessão.

REGRESSÕES ENCONTRADAS: O primeiro refinamento de tipos do preview não estreitava os
dois membros da união.

REGRESSÕES CORRIGIDAS: Narrowing explícito por presença e tipo de `variant_id`.

PRÓXIMA FASE: Fase 5 — higiene e versionamento Git; Fase 11 tratará o lint pendente.

CRITÉRIO DE FINALIZAÇÃO: A fase permanece reprovada porque o lint completo e a
navegação manual obrigatória não passaram, embora os 12 erros, o build e o SSR estejam
tecnicamente recuperados.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 5 — Higiene e versionamento do Git
PRIORIDADE: P0
STATUS: BLOQUEADA

OBJETIVO DA FASE: Classificar todos os não rastreados, impedir versionamento de
artefatos/segredos e provar um snapshot reproduzível somente com conteúdo selecionado.

BASELINE ANTERIOR: 149 arquivos não rastreados na fotografia da fase, código de
produção fora do índice, lockfile do commit inconsistente e token rastreado.

ARQUIVOS ANALISADOS: Todos os 149 caminhos individualmente, arquivos rastreados com
padrões sensíveis, manifests, lockfile e regras Git.

ARQUIVOS ALTERADOS: `.gitignore`, remoção de `apps/storefront/token.txt`, scripts de
package seguros e documentos desta fase; 99 caminhos foram preparados seletivamente
no índice.

MIGRATIONS: A migration do módulo product-sales-policy foi classificada/versionada;
nenhuma migration foi executada. Script de seed disfarçado de migration ficou fora.

COMANDOS EXECUTADOS: Inventários Git, scan por nomes e assinaturas sem valores,
`pnpm install --frozen-lockfile`, criação de snapshots via `git archive`/`git
write-tree`, typechecks, builds, unitários e lint.

TESTES EXECUTADOS: Snapshot do commit anterior e snapshot seletivo do índice; install
congelado; TypeScript backend/storefront; dois builds; 20 unitários backend; diff check.

RESULTADO DO LINT: Backend no snapshot com 0 erros/61 warnings; storefront reprovado
com 528 erros e 94 warnings.

RESULTADO DO TYPESCRIPT: Storefront aprovado; backend aprovado após o build gerar os
tipos Medusa. Antes dessa geração, sete resoluções de módulo aparecem como `unknown`.

RESULTADO DO BUILD: Backend/admin Medusa e storefront client/SSR aprovados no snapshot
criado exclusivamente do índice.

RESULTADO DOS TESTES UNITÁRIOS: 6 suites e 20 testes backend aprovados no snapshot.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Não executados nesta fase.

RESULTADO DO E2E: Não executado nesta fase.

RESULTADO MANUAL NO NAVEGADOR: Não aplicável às mudanças de higiene; navegador segue
indisponível para fases visuais.

RESULTADO DO BACKEND: Build reproduzível a partir do índice; 61 warnings preservados.

RESULTADO DO BANCO: Nenhuma escrita ou migration executada.

RESULTADO DE SEGURANÇA: Um JWT de alta confiança foi removido da árvore atual e
bloqueado no ignore; nenhum valor foi exibido. O segredo permanece no histórico.

PROBLEMAS ENCONTRADOS: Commit atual não instala com lock congelado; token estava
rastreado; 45 itens exigem remoção/migração; lint storefront continua vermelho.

CAUSA RAIZ: Funcionalidades e lockfile acumulados fora do Git, junto de artefatos,
scripts avulsos e um token commitado.

CORREÇÕES APLICADAS: Classificação 149/149, ignore ampliado, seleção explícita sem
`git add -A`, remoção do token atual e exclusão de scripts de seed não homologados do
manifest.

EVIDÊNCIAS: `DOC_ROWS=149`, `DOC_UNIQUE=149`; snapshot anterior falhou frozen install;
snapshot seletivo passou install, builds, storefront TypeScript e 20 testes; cached
`git diff --check` passou.

ITENS MARCADOS NO CHECKLIST: Todos os itens técnicos; gate externo de rotação aberto.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `UNTRACKED-FILES-CLASSIFICATION.md` e
`SECRET-SCAN-REPORT.md`.

PENDÊNCIAS: Revogar/rotacionar o token, coordenar limpeza do histórico, migrar/remover
os 45 itens e corrigir o lint na Fase 11.

BLOQUEIOS EXTERNOS: Acesso ao emissor do token e coordenação de reescrita do histórico.

REGRESSÕES ENCONTRADAS: Typecheck backend depende dos tipos gerados pelo build em
checkout limpo.

REGRESSÕES CORRIGIDAS: Ordem validada no snapshot; CI deverá gerar tipos antes do
typecheck ou versionar declarações estáveis.

PRÓXIMA FASE: Fase 6 — CI obrigatório, incluindo geração de tipos e secret scanning.

CRITÉRIO DE FINALIZAÇÃO: A fase permanece bloqueada até haver evidência de rotação do
token; o trabalho técnico local e o snapshot seletivo estão concluídos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 6 — CI obrigatório
PRIORIDADE: P0
STATUS: REPROVADA

OBJETIVO DA FASE: Implementar um pipeline GitHub Actions obrigatório, separado por
responsabilidade, reproduzível e incapaz de esconder falhas.

BASELINE ANTERIOR: Workflow backend incompleto, CD placeholder verde, nenhuma
cobertura obrigatória conjunta de backend, storefront, integração, migrations, E2E,
segredos e artefatos.

ARQUIVOS ANALISADOS: Workflows existentes, manifests/lockfile, scripts de teste,
configurações Medusa/Jest/Playwright, migrations, relatórios gerados e histórico Git.

ARQUIVOS ALTERADOS: `.github/workflows/ci.yml`,
`.github/workflows/backend-cd.yml`, remoção do workflow backend antigo,
`scripts/ci/check-forbidden-artifacts.mjs`, manifests, teste unitário storefront,
setup/teste de integração, contenção da rota `/store/checkout`, remoção do workflow
checkout inseguro e documentação.

MIGRATIONS: Schema executado em banco PostgreSQL vazio isolado e repetido no mesmo
banco com exit code 0; banco temporário removido. Scripts comerciais foram
temporariamente excluídos do CI com `--skip-scripts` após ser detectada criação de
catálogo/preço/estoque não homologados.

COMANDOS EXECUTADOS: Install congelado; Prettier do workflow; guard de artefatos;
build/typecheck/lint/unitários backend e storefront; integração HTTP; duas migrations
isoladas; prova de exit code proposital; `git diff --check` e `git status --short`.

TESTES EXECUTADOS: 21 unitários backend, 2 unitários storefront, 1 integração HTTP,
migration vazia, repetição idempotente, build Medusa, build Vite client/SSR, parsers
do workflow e guard do repositório.

RESULTADO DO LINT: Backend aprovado com 0 erros/76 warnings. Storefront reprovado com
527 erros e 94 warnings.

RESULTADO DO TYPESCRIPT: Backend e storefront aprovados com 0 erro.

RESULTADO DO BUILD: Backend/admin Medusa e storefront client/SSR aprovados. O primeiro
build detectou três erros em workflow antigo; após a contenção, a repetição passou.

RESULTADO DOS TESTES UNITÁRIOS: Backend 6 suítes/21 testes aprovados; storefront
2/2 testes aprovados.

RESULTADO DOS TESTES DE INTEGRAÇÃO: Medusa/PostgreSQL real 1 suíte/1 teste aprovado,
com banco temporário criado, migrado e descartado.

RESULTADO DO E2E: Job criado, mas não aprovado localmente; depende da recuperação da
Fase 30 e o job fica bloqueado pelos predecessores vermelhos.

RESULTADO MANUAL NO NAVEGADOR: Não executado; o navegador da IDE informou que nenhuma
instância está disponível.

RESULTADO DO BACKEND: Build, TypeScript, lint sem erros, unitários e health de
integração aprovados; 76 warnings ainda classificados como dívida.

RESULTADO DO BANCO: PostgreSQL 16 local aprovado em schema vazio e segunda execução;
nenhum banco persistente foi apagado, e o banco temporário foi removido.

RESULTADO DE SEGURANÇA: Job Gitleaks analisa histórico completo com saída redigida;
guard aprovou 729 rastreados. O histórico contém JWT já documentado, portanto o job
deve reprovar até revogação e limpeza coordenada.

PROBLEMAS ENCONTRADOS: 527 erros de lint storefront; JWT histórico; migrations
disfarçadas de seeds com preço/estoque fictícios; rota customizada de checkout usava
`any`, valor fixo e tentativa Mercado Pago; Playwright ainda não homologado.

CAUSA RAIZ: Dívida acumulada não era bloqueada por CI; código comercial e artefatos
foram versionados sem gates; scripts de dados foram colocados no ciclo de migration.

CORREÇÕES APLICADAS: Seis jobs fail-closed, relatórios em falha, scan de histórico,
guard de artefatos, integração real, migrations isoladas, CD placeholder bloqueado e
rota `/store/checkout` convertida para 503 sem workflow inseguro.

EVIDÊNCIAS: Workflow parseado pelo Prettier; nenhum `continue-on-error`; erro
proposital retornou 23; guard `729 files`; backend build/typecheck exit 0; 21+2
unitários; integração 1/1; migrations 0/0; storefront build/typecheck exit 0; lint
storefront exit 1 com 527/94.

ITENS MARCADOS NO CHECKLIST: Três entregas técnicas finalizadas; gate da fase
explicitamente reprovado.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `docs/ci/CI-PIPELINE.md`.

PENDÊNCIAS: Corrigir lint storefront, remover/homologar seeds comerciais na Fase 7,
rotacionar/limpar segredo histórico e recuperar Playwright na Fase 30.

BLOQUEIOS EXTERNOS: Acesso ao emissor do JWT, coordenação de reescrita do histórico e
execução real do workflow após commit/push autorizado.

REGRESSÕES ENCONTRADAS: Build passou a enxergar tipos gerados e expôs o workflow de
checkout inseguro; migration completa executava seeds não homologados.

REGRESSÕES CORRIGIDAS: Checkout customizado agora retorna 503 e está no middleware;
workflow inseguro removido; CI de schema usa `--skip-scripts` até a auditoria.

PRÓXIMA FASE: Fase 7 — models, workflows e migrations.

CRITÉRIO DE FINALIZAÇÃO: A implementação do pipeline está completa, mas a fase não é
100% aprovada porque um gate obrigatório retorna exit code 1, o scan deve detectar o
segredo histórico e o E2E ainda não foi homologado. Status correto: REPROVADA.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CHECK-IN DA FASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FASE: 7 — Models, workflows e migrations
PRIORIDADE: P0
STATUS: REPROVADA

OBJETIVO DA FASE: Sincronizar models, migrations, constraints, índices, workflows e
schema real sem alterar o banco original nem criar dados comerciais fictícios.

BASELINE ANTERIOR: Quatro models sem migration/tabela, scripts de seed executados como
migration, providers fake, índices ausentes e workflows com campos/chaves divergentes.

ARQUIVOS ANALISADOS: Nove models/tabelas customizadas, 8 links, todos os workflows,
scripts/seeds, config Medusa, migrations e metadados dos bancos `frigga`/`frigga_test`.

ARQUIVOS ALTERADOS: Models e snapshots de 6 módulos, 6 migrations novas, criptografia
e rota de customer profile, audit step, rotas de contenção, config Medusa, CI, testes,
guard de seed, `.gitignore` e documentação. Scripts/providers inseguros foram movidos
para quarentena local ignorada.

MIGRATIONS: `Migration20260726051324` a `...1329`; banco vazio, cópia restaurada,
rollback e remigration aprovados.

COMANDOS EXECUTADOS: Inventários `rg`, consultas metadata-only via `psql`,
`medusa db:generate`, `pg_dump`, `pg_restore`, `db:migrate`, `db:rollback`, guard de
seed, build/typecheck/lint/unitários/integração.

TESTES EXECUTADOS: DML constraints, criptografia fail-closed, pagamento contido,
migration vazia/existente, rollback, segunda geração, ausência de seed e health HTTP.

RESULTADO DO LINT: Backend aprovado com 0 erros e 22 warnings.

RESULTADO DO TYPESCRIPT: Backend aprovado com 0 erro após geração de tipos Medusa.

RESULTADO DO BUILD: Backend e Admin Medusa aprovados.

RESULTADO DOS TESTES UNITÁRIOS: 6 suítes e 25 testes aprovados.

RESULTADO DOS TESTES DE INTEGRAÇÃO: 1 suíte/1 teste HTTP com PostgreSQL aprovado.

RESULTADO DO E2E: Não aplicável diretamente; continua pendente para a Fase 30.

RESULTADO MANUAL NO NAVEGADOR: Não aplicável às mudanças de schema; navegador da IDE
continua indisponível.

RESULTADO DO BACKEND: Módulos carregam sem provider de pagamento/frete fictício;
build, tipos, unitários e integração aprovados.

RESULTADO DO BANCO: Original não alterado. Dump 618.468 bytes restaurado em cópia;
9 tabelas customizadas, 7 índices e 6 checks validados; temporários removidos.

RESULTADO DE SEGURANÇA: CPF/CNPJ deixou de ser persistido em claro no novo model;
chave ausente falha fechada; idempotência/replay têm unicidade; zero seed comercial.

PROBLEMAS ENCONTRADOS: 4 models sem migration, 6 seeds/scripts comerciais, 13 scratch
scripts, dois providers falsos e 96 ocorrências de `any`/`@ts-ignore`.

CAUSA RAIZ: Modelos e código foram adicionados sem gerar migrations; seeds e providers
temporários ficaram dentro do runtime; workflows cresceram sem tipagem de links.

CORREÇÕES APLICADAS: Migrations pelo CLI, índices/checks, API cifrada, guard CI sem
seed, quarentena local, contenção 503 e audit step alinhado ao model.

EVIDÊNCIAS: `CUSTOM_TABLES=9`, `REQUIRED_INDEXES=7`, `REQUIRED_CHECKS=6`,
`ORPHAN_LINK_ROWS=0`, rollback `5/0`, segunda geração `12/12`, produtos/variantes/
preços/inventário `0/0/0/0`, build/typecheck/integration exit 0, 25 unitários.

ITENS MARCADOS NO CHECKLIST: Mapa, divergências críticas e testes de banco concluídos;
gate de tipagem insegura reprovado.

ARQUIVOS DE DOCUMENTAÇÃO CRIADOS: `docs/database/MODEL-MIGRATION-AUDIT.md`.

PENDÊNCIAS: Eliminar 96 tipos inseguros nas fases 8–20, criar histórico de
consentimentos na Fase 32 e repetir em staging.

BLOQUEIOS EXTERNOS: Dados comerciais reais, homologação de frete/gateway e ambiente de
staging ainda não disponíveis.

REGRESSÕES ENCONTRADAS: Migration completa populava catálogo/estoque e runtime
registrava frete zero; workflows refund/webhook não correspondiam aos models.

REGRESSÕES CORRIGIDAS: Seeds/providers retirados do runtime, CI impede reintrodução,
rotas respondem 503 e migrations são reproduzíveis/reversíveis.

PRÓXIMA FASE: Fase 8 — estratégia única de autenticação.

CRITÉRIO DE FINALIZAÇÃO: Todos os gates de schema passaram, mas o escopo auditado
ainda contém 96 tipos expressamente proibidos. A fase permanece REPROVADA até essas
ocorrências serem removidas e os fluxos relacionados repetidos.
