#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=wsl-guard-lib.sh
source "$SCRIPT_DIR/wsl-guard-lib.sh"

require_wsl
require_expected_paths
for command_name in git curl systemctl; do require_command "$command_name"; done
require_no_recent_wsl_poweroff
DEPLOYED_COMMIT_SHA="$(git -C "$FRIGGAFRIO_DEPLOY_DIR" rev-parse HEAD)"
verify_medusa_runtime_contract "$FRIGGAFRIO_DEPLOY_DIR" --require-runtime-dependencies
require_backend_service_runtime_contract
systemctl is-active --quiet friggafrio-backend.service || deploy_fail "VERIFY_BACKEND_SERVICE_FAILED"
systemctl is-active --quiet friggafrio-storefront.service || deploy_fail "VERIFY_STOREFRONT_SERVICE_FAILED"
curl --fail --silent --show-error --max-time 20 http://127.0.0.1:9000/health >/dev/null || deploy_fail "VERIFY_BACKEND_HEALTH_FAILED"
PUBLISHABLE_KEY="$(read_publishable_key)" || deploy_fail "VERIFY_PUBLISHABLE_KEY_UNAVAILABLE"
curl --fail --silent --show-error --max-time 20 -H "x-publishable-api-key: $PUBLISHABLE_KEY" 'http://127.0.0.1:9000/store/products?limit=1' >/dev/null || deploy_fail "VERIFY_STORE_API_FAILED"
curl --fail --silent --show-error --max-time 20 http://127.0.0.1:5173/br >/dev/null || deploy_fail "VERIFY_STOREFRONT_FAILED"
curl --fail --silent --show-error --max-time 30 "$FRIGGAFRIO_PUBLIC_ORIGIN/" >/dev/null || deploy_fail "VERIFY_PUBLIC_URL_FAILED"
echo "DEPLOYED_COMMIT_SHA=$DEPLOYED_COMMIT_SHA"
echo "VERIFY_STABILITY_WINDOW_SECONDS=300"
echo "DEPLOY_VERIFY=PASS"
