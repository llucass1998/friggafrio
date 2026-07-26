# Fonte de verdade

- [ ] Branch identificada.
- [ ] Commit identificado.
- [ ] Diferença entre local e origin identificada.
- [ ] Alterações locais preservadas.
- [ ] Worktrees identificados.
- [ ] Processos Windows identificados.
- [ ] Processos WSL identificados.
- [ ] Containers identificados.
- [ ] Porta 9000 identificada.
- [ ] Diretório do backend em execução identificado.
- [ ] Somente um backend ficou ativo.
- [ ] Backend e frontend usam o mesmo commit.

# Configuração

- [ ] `medusa-config.ts` auditado.
- [ ] `.env` auditado sem expor valores.
- [ ] `.env.template` auditado.
- [ ] Variáveis obrigatórias identificadas.
- [ ] DATABASE_URL validada.
- [ ] REDIS_URL validada.
- [ ] STORE_CORS validado.
- [ ] ADMIN_CORS validado.
- [ ] AUTH_CORS validado.
- [ ] COOKIE_SECRET validado.
- [ ] JWT_SECRET validado.
- [ ] Payments continuam desabilitados.

# Build

- [ ] Dependências congeladas instaladas.
- [ ] Tipos gerados.
- [ ] TypeScript aprovado.
- [ ] Lint aprovado.
- [ ] Build Medusa aprovado.
- [ ] Nenhum import inexistente.
- [ ] Nenhum provider em quarentena foi reativado.
- [ ] Nenhum módulo quebrado permanece registrado.

# Banco e migrations

- [ ] PostgreSQL acessível.
- [ ] Estado das migrations identificado.
- [ ] Nenhuma migration existente foi alterada.
- [ ] Migration em banco descartável vazio aprovada.
- [ ] Segunda execução idempotente aprovada.
- [ ] Cópia isolada do banco existente aprovada.
- [ ] Nenhum catálogo comercial foi criado por migration.
- [ ] Nenhum dado real foi removido.
- [ ] Links Medusa foram validados.
- [ ] Constraints foram validadas.

# Redis

- [ ] Redis acessível.
- [ ] Redis responde PONG.
- [ ] Backend usa a mesma REDIS_URL.
- [ ] Falha do Redis é corretamente reportada.
- [ ] Nenhum Redis falso em memória foi usado como prova.

# Medusa Admin

- [ ] Admin está habilitado.
- [ ] `/app` carrega.
- [ ] Assets do Admin carregam.
- [ ] Login do Admin aparece.
- [ ] Login do Admin funciona.
- [ ] Sessão do Admin funciona.
- [ ] Produtos carregam.
- [ ] Estoque carrega.
- [ ] Pedidos carregam.
- [ ] Console do Admin está limpo.
- [ ] Network do Admin está limpo.
- [ ] Refresh no Admin funciona.

# Store API

- [ ] `/health` funciona.
- [ ] Região brasileira funciona.
- [ ] Moeda BRL funciona.
- [ ] Sales Channel funciona.
- [ ] Produtos funcionam.
- [ ] Variantes funcionam.
- [ ] Preços funcionam.
- [ ] Estoque funciona.
- [ ] Carrinho funciona.
- [ ] Sessão de cliente funciona.
- [ ] Logout funciona.
- [ ] Nenhum pagamento foi habilitado.

# Integração com frontend

- [ ] Backend URL correta.
- [ ] Publishable key correta.
- [ ] CORS correto.
- [ ] Cookies enviados.
- [ ] Login funciona.
- [ ] Minha Conta funciona.
- [ ] Editar perfil funciona.
- [ ] Logout funciona sem F5.
- [ ] Carrinho consegue chamar Store API.
- [ ] Erros reais aparecem corretamente.

# Qualidade

- [ ] Unitários aprovados.
- [ ] Integração HTTP aprovada.
- [ ] Admin aprovado no navegador.
- [ ] Storefront aprovado no navegador.
- [ ] Git diff check aprovado.
- [ ] Nenhuma regressão de segurança.
- [ ] Relatório final criado.
