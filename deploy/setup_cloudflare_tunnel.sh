#!/bin/bash
set -e

echo "=== Configuração do Cloudflare Tunnel Local ==="
echo ""
echo "Para expor sua máquina globalmente nos domínios da FriggaFrio sem precisar de VPS,"
echo "você precisa criar um Cloudflare Tunnel pela dashboard do Cloudflare Zero Trust."
echo ""
echo "PASSOS:"
echo "1. Acesse: https://one.dash.cloudflare.com/"
echo "2. Vá em Networks > Tunnels e crie um novo Tunnel (ex: 'frigga-local')"
echo "3. Copie o TOKEN de autenticação longo que ele vai te dar."
echo "4. Cole o token abaixo:"
echo ""

read -p "CLOUDFLARE_TUNNEL_TOKEN: " TUNNEL_TOKEN

if [ -z "$TUNNEL_TOKEN" ]; then
    echo "Erro: Token vazio."
    exit 1
fi

echo ""
echo "5. Na dashboard do Cloudflare, configure as rotas do túnel (Public Hostnames):"
echo "   - api.friggafrio.com.br -> HTTP://backend:9000"
echo "   - admin.friggafrio.com.br -> HTTP://backend:9000 (ou porta do seu painel se separado)"
echo "   - www.friggafrio.com.br -> HTTP://storefront:8000 (quando buildado)"
echo ""
echo "Iniciando o Tunnel via Docker..."

export CLOUDFLARE_TUNNEL_TOKEN="$TUNNEL_TOKEN"

# Roda no mesmo stack do docker-compose para enxergar a rede
docker compose -f docker-compose.local.yml -f docker-compose.tunnel.yml up -d cloudflared

echo "Tunnel iniciado! Verifique na dashboard do Cloudflare se o status está 'Healthy'."
EOF