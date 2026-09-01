#!/usr/bin/env bash
set -euo pipefail

project_root=${1:?usage: configure-network.sh <project-root> <storefront-origin> <backend-origin>}
storefront_origin=${2:?usage: configure-network.sh <project-root> <storefront-origin> <backend-origin>}
backend_origin=${3:?usage: configure-network.sh <project-root> <storefront-origin> <backend-origin>}

replace_env() {
  local file=$1
  local key=$2
  local value=$3

  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '\n%s=%s\n' "$key" "$value" >> "$file"
  fi
}

backend_env="$project_root/apps/backend/.env"
storefront_env="$project_root/apps/storefront/.env"

replace_env "$storefront_env" "VITE_MEDUSA_BACKEND_URL" "$backend_origin"
replace_env "$storefront_env" "VITE_MEDUSA_ADMIN_URL" "$backend_origin"
replace_env "$backend_env" "STORE_CORS" "$storefront_origin"
replace_env "$backend_env" "AUTH_CORS" "$storefront_origin"
replace_env "$backend_env" "ADMIN_CORS" "$storefront_origin,$backend_origin"
replace_env "$backend_env" "STOREFRONT_URL" "$storefront_origin"
replace_env "$backend_env" "DISABLE_MEDUSA_ADMIN" "false"

echo "Configured storefront and API origins without printing secret values."
