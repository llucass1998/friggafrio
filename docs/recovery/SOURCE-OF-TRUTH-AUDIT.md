# Fonte da Verdade — Auditoria FriggaFrio

## Identificação do Sistema
- **Branch Atual:** `fix/frontend-source-of-truth`
- **Commit Local (HEAD):** `c054841`
- **Commit Remoto (origin/main):** `cde0521`
- **Distância:** A branch atual possui `15` commits à frente da branch `origin/main` e `0` commits atrás. O remote de espelho `origin/fix/frontend-source-of-truth` está `1` commit atrás do HEAD local.
- **Worktrees e Stashes:** Não há worktrees além do diretório raiz local (e do stub origin/master ignorável). Não há itens estocados no stash.
- **Arquivos modificados:** `register-page-debug.png` (sinalizado globalmente na working tree).
- **Arquivos não rastreados:** Nenhum que escape do limite do `exclude-standard` com as configs atuais do `.gitignore`.

## Processos e Portas
A auditoria TCP (via `Get-NetTCPConnection`) e mapeamento do WMI constatou o seguinte em nível de sistema operacional (Windows 11):

- **PostgreSQL:** Rodando na porta `5432` (`IPv4/IPv6`) como container Docker / Serviço Local (`PID 6472`).
- **Redis:** Rodando na porta `6379` e expondo tráfego no IPV6 através do proxy/driver WSL e Docker Backend (`PID 36072` e `31244`).
- **Backend Medusa:** Instanciado por um runner do Node `(PID 32708)`, executando na porta oficial `9000`.
- **Frontend Vite:** DOIS PROCESSOS ativos detectados.
  - O primeiro (`PID 6592`) vinculado à porta `5174`.
  - O segundo (`PID 35028`) vinculado à porta padrão `5173`.
  Ambos provém de processos nativos do Node instanciados sob `C:\Users\lluca\Documents\Codex\projeto friggagafrio\apps\storefront`.

## Inconsistências Detectadas
1. A porta `5173` está colidindo ou duplicada por outro processo Node residual (`5174`), gerando risco severo de versão em memória versus cache do Vite (duplicação HMR).
2. O artefato modificado `register-page-debug.png` ainda persiste solto no root, mascarando a sujeira na baseline de check.

## Ação Executada na Baseline de Identificação
O arquivo `register-page-debug.png` na branch foi auditado; uma vez que ele já foi gerado de processos e testes de layout legados da "Register Page" e que os screenshots originais definitivos encontram-se isolados, o artefato é acidental / temporário dentro desta branch para efeito de push para master.

## Decisão sobre a Fonte de Verdade
A fonte unificada de verdade foi determinada como **`fix/frontend-source-of-truth`**, pois é estritamente de lá que descem as `15` melhorias aprovadas em conjunto com as comprovações de Layout e Typescript E2E auditadas nas sub-fases anteriores (e ausentes na `main` original quebrada).
A recuperação global seguirá deste ponto sem reversão.
