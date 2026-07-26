# Deploy de Produção (Medusa v2 + NGINX + Certbot)

Esta pasta contém toda a arquitetura de roteamento e containers para subir o backend `api.friggafrio.com.br` de forma segura (HTTPS) e atrelado aos domínios do Frontend (`www.friggafrio.com.br`) e do Admin (`admin.friggafrio.com.br`).

## Estrutura
- `docker-compose.production.yml`: Arquivo com a topologia completa para produção. Inclui:
  - NGINX atuando como Proxy Reverso + TLS
  - Certbot (Let's Encrypt) para obter e renovar o certificado automaticamente.
  - Backend Medusa v2 (Exposto somente via proxy).
  - PostgreSQL 16
  - Redis 7
- `nginx/nginx.conf`: Roteamento e Proxy Reverso da porta 9000 (Medusa) respondendo no bloco TLS.
- `init-letsencrypt.sh`: Script mágico para você gerar seu certificado de primeira de forma blindada.

## Como colocar no Ar pela primeira vez

1. Tenha certeza de que o DNS do domínio `api.friggafrio.com.br` está apontando para o IP do seu Servidor VPS / Instância Cloud.
2. Na raiz do projeto, acesse a pasta deploy:
   ```bash
   cd deploy
   ```
3. Rode o script de geração de certificado do Let's Encrypt. Ele criará um dummy cert e depois substituirá pelo oficial, reiniciando o NGINX:
   ```bash
   ./init-letsencrypt.sh
   ```
4. Verifique se os containers subiram de forma permanente:
   ```bash
   docker compose -f docker-compose.production.yml ps
   ```

A API já deverá estar online respondendo em `https://api.friggafrio.com.br/health/live`.

> **Nota:** Certifique-se de configurar e exportar a string `${DATABASE_URL}` e as senhas do banco de produção como variáveis de ambiente da sua máquina antes de ligar a stack com o comando `.env` correto.
