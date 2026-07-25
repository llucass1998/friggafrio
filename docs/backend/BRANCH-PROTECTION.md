# Branch Protection - Recomendações

## Configuração esperada para `main`

* Pull request obrigatório para merge.
* Pelo menos uma aprovação de reviewer.
* Conversas resolvidas antes do merge.
* Branch atualizada (up-to-date) antes de merge.
* CI obrigatório (status check `backend-ci`).
* CodeQL obrigatório quando disponível.
* Proibir force push em `main`.
* Proibir exclusão de `main`.
* Deploy de produção somente após aprovação via GitHub Environment `production`.
* Secrets de pagamento e credenciais separados por environment (staging/production).
* Produção não acessível por pull requests de forks.

## Configuração esperada para `develop`

* Pull request obrigatório.
* CI obrigatório.
* Pelo menos uma aprovação.
* Force push proibido (exceto em branches de feature pessoais).

## Environments

| Environment | Branch  | Approval | Secrets separados |
|-------------|---------|----------|--------------------|
| staging     | develop | Automático | Sim               |
| production  | main    | Manual 1+ | Sim               |
