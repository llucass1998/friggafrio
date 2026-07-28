# Backend Startup Recovery Report

## Resumo da Falha
O backend estava falhando em inicializar e as APIs estavam retornando HTTP 500 ou `ERR_CONNECTION_REFUSED`. A inicialização do Medusa ficava em estado inconsistente.

## 1. Tratamento do Port Conflict (PostgreSQL FATAL - 53300)
- **Problema:** A máquina do desenvolvedor (Windows) possuía uma instalação nativa do PostgreSQL já escutando na porta `5432`. O Docker Compose ou comandos do Docker estavam tentando subir os containers do Postgres do projeto exatamente na mesma porta, gerando conflito.
- **Resolução:** O container conflitante (`deploy-postgres-1`) foi interrompido.
- **Ação Segura:** Foi executado um container standalone temporário (`frigga-postgres-temp`) mapeando a porta host `5434` para a porta `5432` do container. O volume persistente (`postgres-data`) foi anexado para garantir a retenção dos dados sem alterações destrutivas.

## 2. Tratamento das Credenciais do Banco
- **Problema:** O arquivo `.env` do backend apontava para a porta correta, porém a senha do PostgreSQL do Docker (`postgrespassword`) divergia da senha padrão.
- **Resolução:** A connection string no `.env` foi atualizada de `postgres://postgres:postgres@localhost:5434/frigga` para `postgres://postgres:postgrespassword@localhost:5434/frigga`.
- Essa correção solucionou os logs de erro do Knex relacionados a recusas de senha e esgotamento do Connection Pool.

## 3. Limpeza Silenciosa de Processos Suspensos
- **Problema:** O backend do Medusa apresentava erro `EADDRINUSE :::9000` após a reinicialização. Os ambientes Git Bash do Windows não possuíam ferramentas padrão como `pkill`.
- **Resolução:** A ferramenta `Get-NetTCPConnection -LocalPort 9000` via PowerShell foi utilizada para mapear o PID associado à porta 9000, permitindo o isolamento e encerramento limpo do processo travado usando `Stop-Process -Id <PID> -Force`.

## Conclusão
O backend se recuperou totalmente sem necessidade de dropar o banco (`rm -rf` / `psql -c "DROP..."`) ou bypassar TLS. A API `GET /store/product-categories` voltou a operar (HTTP 200 com array vazio esperado para o dump inicial) e o container isolado estabilizou o banco.
