#!/bin/bash
set -Eeuo pipefail

echo "Executing preflight checks..."
docker info >/dev/null 2>&1 || { echo "Docker is not running"; exit 1; }
docker compose version >/dev/null 2>&1 || { echo "Docker Compose not found"; exit 1; }
echo "Preflight checks passed."

export DOMAIN="friggafrio.com.br"
export FRONTEND_DOMAIN="www.friggafrio.com.br"
export API_DOMAIN="api.friggafrio.com.br"
export ADMIN_DOMAIN="admin.friggafrio.com.br"

