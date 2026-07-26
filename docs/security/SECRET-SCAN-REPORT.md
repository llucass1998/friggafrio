# FriggaFrio — Relatório de scan de segredos

Data: 2026-07-26
Escopo: arquivos rastreados, modificados e não rastreados, excluindo dependências,
builds, caches e outros caminhos ignorados
Ferramenta dedicada: `gitleaks` não disponível; busca local por padrões aplicada
Valores sensíveis exibidos neste relatório: **nenhum**

## Resultado executivo

Foi encontrado **um token JWT de alta confiança** em
`apps/storefront/token.txt`. O arquivo estava rastreado desde o commit `e576de2` e foi
removido do worktree. O `.gitignore` agora bloqueia `token.txt`, arquivos `*.token` e
artefatos nominais de access/refresh token.

O segredo continua recuperável no histórico Git. Portanto:

1. a credencial deve ser considerada comprometida e revogada/rotacionada;
2. a origem e o uso do token devem ser identificados pelo responsável da conta;
3. a remoção do histórico remoto deve ser coordenada antes de qualquer reescrita;
4. após a rotação, executar ferramenta dedicada de secret scanning no CI.

Nenhum outro token com assinatura de alta confiança foi encontrado na árvore de
trabalho após a remoção.

## Busca por nomes sensíveis

A busca encontrou identificadores como `password`, `JWT_SECRET`, `DATABASE_URL`,
`REDIS_URL`, `client_secret` ou `webhook_secret` em 36 arquivos. A inspeção foi feita
sem imprimir valores. Os achados restantes são referências a variáveis de ambiente,
schemas de entrada, templates, testes e configurações de CI/deploy.

Arquivos de maior atenção:

- `apps/backend/.env.example`, `.env.template` e `.env.test`: somente placeholders ou
  credenciais locais/de teste; nunca usar em produção;
- `deploy/docker-compose.production.yml`: referências `${...}`, sem valor embutido;
- `apps/backend/test-db.js` e `test-db2.js`: scripts temporários com configuração de
  banco; classificados para remoção e não versionamento;
- `apps/backend/update_onSubmitPerson.js`: script temporário com manipulação de senha;
  classificado para remoção;
- testes E2E locais ignorados e relatórios Playwright: não devem entrar no Git.

## Padrões verificados

- tokens GitHub;
- chaves Stripe live;
- access/refresh token;
- JWT de três segmentos;
- AWS access key;
- cabeçalho de private key;
- client/webhook secret;
- password;
- JWT secret;
- database/Redis URL.

## Limitações e bloqueios

- Sem `gitleaks`, TruffleHog ou scanner equivalente instalado.
- O histórico completo e repositórios remotos não foram reescritos.
- Rotação/revogação exige acesso ao emissor da credencial.

Até a rotação ser confirmada, o gate de segredos permanece **bloqueado** mesmo com o
arquivo removido da árvore atual.
