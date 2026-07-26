#!/bin/bash
echo "Inicializando o ambiente WSL e Docker pelo Pipeline da FriggaFrio..."

# Valida se está rodando no WSL
if grep -q microsoft /proc/version; then
  echo "✅ WSL Detectado."
else
  echo "⚠️ Este script foi feito para rodar dentro do WSL."
fi

# Setando Domains
export CORS_STORE="https://www.friggafrio.com.br,https://friggafrio.com.br"
export CORS_ADMIN="https://admin.friggafrio.com.br"
export API_URL="https://api.friggafrio.com.br"

echo "Domínios configurados: $CORS_STORE"
echo "Subindo os containers..."
docker compose -f docker-compose.local.yml up -d

echo "Aguardando banco de dados ficar saudável..."
sleep 5

# Dica para a VPN
echo "Se a conexão do banco estiver bloqueando no Docker Desktop via WSL por causa da VPN, rode o WSL2 com o custom network bridge ativado (wsl.conf) ou desative o modo 'Strict' da VPN temporariamente."
